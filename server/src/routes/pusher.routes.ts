import Koa from "koa";
import Router from "koa-router";
import { pusher } from "./message.routes";
import { db } from "../db/db";
import { teams } from "../db/schema/teams";
import { teamMembers } from "../db/schema/team_members";
import { eq } from "drizzle-orm";

const router = new Router({ prefix: "/pusher" });

router.post("/auth", async (ctx: Koa.Context) => {
  const socketId = ctx.request.body.socket_id;
  const channel = ctx.request.body.channel_name;
  // do some authorizing
  const user = JSON.parse(ctx.request.body.user);

  const authResponse = pusher.authorizeChannel(socketId, channel);

  ctx.status = 200;
  ctx.body = authResponse;
});

router.post("/user-auth", async (ctx: Koa.Context) => {
  const socketId = ctx.request.body.socket_id;
  const { id, ...rest } = JSON.parse(ctx.request.body.user);

  const userTeams = await db
    .select()
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, id));

  const teamIds = userTeams.map((team) => team.teams.id);

  const user = {
    id,
    user_info: {
      ...rest,
      teamIds,
    },
  };

  const authResponse = pusher.authenticateUser(socketId, user);
  ctx.status = 200;
  ctx.body = authResponse;
});

export const PusherRoutes = router.routes();
