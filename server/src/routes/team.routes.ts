import Koa from "koa";
import Router from "koa-router";
import { teams } from "../db/schema/teams";
import { messages } from "../db/schema/messages";
import { teamMessages } from "../db/schema/team_messages";
import { db } from "../db/db";
import { v4 } from "uuid";
import { eq, not } from "drizzle-orm";
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
    readBy: [],
  };

  // check team's list length
  const listLength = await messageCache.llen(teamChannelName);
  // if length is >= 10, transfer all messages in list to db
  if (listLength >= 10) {
    for (let i = 0; i <= listLength; ++i) {
      const messageData = await messageCache.lpop(teamChannelName);
      if (messageData) {
        const { messageId, message, senderId, status, senderName, readBy } =
          JSON.parse(messageData);

        const createdMessage = await db
          .insert(messages)
          .values({
            id: messageId,
            message,
            senderId,
            status,
            senderName,
            readBy: JSON.stringify(readBy),
          })
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
    teamId: id,
  });

  ctx.status = 201;
  ctx.body = { message: { id: messageId, ...rest } };
});

router.patch("/:id/messages/:messageId", async (ctx: Koa.Context) => {
  const { id, messageId } = ctx.params;
  // NOTE: readerId would typically be the person making the request,
  // so we could get this from ctx state, instead of from the request body
  const { status, senderId, readerId } = ctx.request.body;
  console.log(readerId);

  const team = await db.select().from(teams).where(eq(teams.id, id)).get();
  if (!team) ctx.throw(404, "team not found");

  const teamMembersList = await db
    .select()
    .from(teamMembers)
    .where(eq(teamMembers.teamId, id))
    .where(not(eq(teamMembers.userId, senderId)));

  if (!teamMembersList || teamMembersList.length === 0)
    ctx.throw(500, "no members on this team");
  const teamMembersSet = new Set(
    teamMembersList.map((teamMember) => teamMember.userId!)
  );

  const teamChannelName = `team-${id}-messages`;

  const redisMessageList = await messageCache.lrange(teamChannelName, 0, -1);
  const parsedMessageList = redisMessageList.map((message) =>
    JSON.parse(message)
  );

  const redisMessageIdx = parsedMessageList
    .map((message) => message.messageId)
    .indexOf(messageId);

  if (redisMessageIdx !== -1) {
    const redisMessage = parsedMessageList[redisMessageIdx];

    if (
      redisMessage.status !== "read-by-all" &&
      status === "read" &&
      redisMessage.senderId !== readerId
    ) {
      const readBySet = new Set(redisMessage.readBy);
      // if reader has not yet read message already,
      // process this read status update for this user
      if (!readBySet.has(readerId)) {
        redisMessage.readBy.push(readerId);
        readBySet.add(readerId);

        let isReadByAll = true;

        for (const userId of teamMembersSet) {
          if (!readBySet.has(userId)) {
            isReadByAll = false;
            break;
          }
        }

        console.log(isReadByAll);

        const updatedStatus = isReadByAll ? "read-by-all" : "read";
        if (!(redisMessage.status === "read" && updatedStatus === "read")) {
          redisMessage.status = updatedStatus;
          messageCache.lset(
            teamChannelName,
            redisMessageIdx,
            JSON.stringify(redisMessage)
          );

          await pusher.trigger(`message-${messageId}`, "status-update", {
            status: updatedStatus,
            senderId,
            id: messageId,
          });
        }
      }
    } else if (status === "delivered") {
      // handle delivered
      redisMessage.status = "delivered";
      messageCache.lset(
        teamChannelName,
        redisMessageIdx,
        JSON.stringify(redisMessage)
      );

      await pusher.trigger(`message-${messageId}`, "status-update", {
        status: "delivered",
        senderId,
        id: messageId,
      });
    }
  } else {
    // handle db status update
    const message = await db
      .select()
      .from(messages)
      .where(eq(messages.id, messageId))
      .get();

    if (!message) ctx.throw(404, "message not found");

    if (status === "read") {
      const readByList: string[] = JSON.parse(message.readBy);
      const readBySet = new Set(readByList);

      if (!readBySet.has(readerId)) {
        readBySet.add(readerId);
        readByList.push(readerId);

        let isReadByAll = true;

        for (const userId of teamMembersSet) {
          if (!readBySet.has(userId)) {
            isReadByAll = false;
            break;
          }
        }

        const updatedStatus = isReadByAll ? "read-by-all" : "read";
        if (!(message.status === "read" && updatedStatus === "read")) {
          const updatedMessage = await db
            .update(messages)
            .set({ readBy: JSON.stringify(readByList), status: updatedStatus })
            .returning()
            .get();

          if (!updatedMessage) ctx.throw(500, "something went wrong");

          await pusher.trigger(`message-${messageId}`, "status-update", {
            status: updatedStatus,
            senderId,
            id: messageId,
          });
        }
      }
    } else if (status === "delivered") {
      const updatedMessage = await db
        .update(messages)
        .set({ status: "delivered" })
        .where(eq(messages.id, messageId))
        .returning()
        .get();
      if (!updatedMessage) ctx.throw(500, "something went wrong");

      await pusher.trigger(`message-${messageId}`, "status-update", {
        status: "delivered",
        senderId,
        id: messageId,
      });
    }
  }

  ctx.status = 200;
});

export const TeamRoutes = router.routes();
