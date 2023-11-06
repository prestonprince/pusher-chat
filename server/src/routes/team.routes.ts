import Koa from "koa";
import Router from "koa-router";
import { teams } from "../db/schema/teams";
import { messages } from "../db/schema/messages";
import { teamMessages } from "../db/schema/team_messages";
import { db } from "../db/db";
import { v4 } from "uuid";
import { eq } from "drizzle-orm";
import { teamMembers } from "../db/schema/team_members";
import { messageCache } from "../main";
import { pusher } from "./message.routes";

const router = new Router({ prefix: "/team" });

router.post("/", async (ctx: Koa.Context) => {
  const { userId, name } = ctx.request.body;

  if (!userId || !name) ctx.throw(400, "must provide userid and name");

  const id = v4();

  try {
    const newTeam = await db
      .insert(teams)
      .values({ id, creatorId: String(userId), name: String(name) })
      .returning()
      .get();
    if (!newTeam) ctx.throw(500, "something went wrong");

    await db
      .insert(teamMembers)
      .values({ id: v4(), userId, teamId: newTeam.id })
      .run();

    ctx.status = 201;
    ctx.body = { team: newTeam };
  } catch (e) {
    console.error(e);

    ctx.throw(500, e.message);
  }
});

router.get("/", async (ctx: Koa.Context) => {
  const allTeams = await db.select().from(teams).all();
  if (!allTeams) ctx.throw(500, "something went wrong");

  ctx.status = 200;
  ctx.body = { teams: allTeams };
});

router.get("/:id/members", async (ctx: Koa.Context) => {
  const teamId = ctx.params.id;

  const team = await db.select().from(teams).where(eq(teams.id, teamId));
  if (!team) ctx.throw(404, "team not found");

  const teamUsers = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, teamId));

  if (!teamUsers) ctx.throw(500, "something went wrong");

  ctx.status = 200;
  ctx.body = { teamMembers: teamUsers };
});

router.get("/:id/messages", async (ctx: Koa.Context) => {
  const teamId = ctx.params.id;
  const teamChannelName = `team-${teamId}-messages`;

  const dbMessageList = await db
    .select()
    .from(teamMessages)
    .leftJoin(messages, eq(teamMessages.messageId, messages.id))
    .where(eq(teamMessages.teamId, teamId));

  const dbMessages = dbMessageList.map((obj) => obj.messages);

  const redisMessageList = await messageCache.lrange(teamChannelName, 0, -1);
  const parsedMessageList = redisMessageList
    .map((message) => JSON.parse(message))
    .map((message) => {
      const { messageId, ...rest } = message;
      return { id: messageId, ...rest };
    });

  ctx.status = 200;
  ctx.body = { messages: [...dbMessages, ...parsedMessageList] };
});

router.post("/:id/messages", async (ctx: Koa.Context) => {
  const { id } = ctx.params;
  const { messageContent, senderId, senderName } = ctx.request.body;

  const teamChannelName = `team-${id}-messages`;

  const team = await db.select().from(teams).where(eq(teams.id, id)).get();
  if (!team) ctx.throw(400, "team not found");

  const messageObj = {
    messageId: v4(),
    message: messageContent,
    senderId,
    status: "sent",
    senderName,
  };

  // check team's list length
  const listLength = await messageCache.llen(teamChannelName);
  // if length is >= 10, transfer all messages in list to db
  if (listLength >= 10) {
    for (let i = 0; i <= listLength; ++i) {
      const messageData = await messageCache.lpop(teamChannelName);
      if (messageData) {
        const { messageId, message, senderId, status, senderName } =
          JSON.parse(messageData);

        const createdMessage = await db
          .insert(messages)
          .values({ id: messageId, message, senderId, status, senderName })
          .returning()
          .get();

        if (!createdMessage) {
          throw new Error("could not create team message in db");
        }

        await db
          .insert(teamMessages)
          .values({ id: v4(), messageId, teamId: id });
      }
    }
  }

  // set message in list
  await messageCache.rpush(teamChannelName, JSON.stringify(messageObj));

  // send message to pusher WSS
  const { messageId, ...rest } = messageObj;
  await pusher.trigger(teamChannelName, "new-message", {
    ...rest,
    id: messageId,
  });

  ctx.status = 201;
  ctx.body = { message: { id: messageId, ...rest } };
});

router.patch("/:id/messages", async (ctx: Koa.Context) => {
  const { id } = ctx.params;
  const { statusUpdates } = ctx.request.body;

  const teamChannelName = `team-${id}-messages`;

  const team = await db.select().from(teams).where(eq(teams.id, id)).get();
  if (!team) ctx.throw(400, "team not found");

  const messageList = (await messageCache.lrange(teamChannelName, 0, -1)).map(
    (message) => JSON.parse(message)
  );

  const updates: Record<string, string>[] = [];

  for (const update of statusUpdates) {
    const redisMessageIdx = messageList
      .map((message) => message.messageId)
      .indexOf(update.messageId);

    if (redisMessageIdx !== -1) {
      const message = messageList[redisMessageIdx];
      message.status = update.status;
      await messageCache.lset(
        teamChannelName,
        redisMessageIdx,
        JSON.stringify(message)
      );

      updates.push({
        status: update.status,
        senderId: update.senderId,
        id: update.messageId,
      });
    } else {
      const updatedMessage = await db
        .update(messages)
        .set({ status: update.status })
        .where(eq(messages.id, update.messageId))
        .returning()
        .get();

      if (!updatedMessage) ctx.throw(500, "something went wrong");

      updates.push({
        status: update.status,
        senderId: update.senderId,
        id: update.messageId,
      });
    }
  }

  await Promise.all(
    updates.map((update) =>
      pusher.trigger(`message-${update.id}`, "status-update", update)
    )
  );

  ctx.status = 200;
  ctx.body = { updates };
});

export const TeamRoutes = router.routes();
