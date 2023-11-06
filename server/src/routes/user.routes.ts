import Koa from "koa";
import Router from "koa-router";
import { db } from "../db/db";
import { teams } from "../db/schema/teams";
import { teamMembers } from "../db/schema/team_members";
import { eq } from "drizzle-orm";

const router = new Router({ prefix: "/user" });

router.get("/:id/teams", async (ctx: Koa.Context) => {
  const id = ctx.params.id;

  const userTeams = await db
    .select()
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .where(eq(teamMembers.userId, id));

  if (!userTeams) ctx.throw(500, "something went wrong");

  ctx.status = 200;
  ctx.body = { result: userTeams };
});

export const UserRoutes = router.routes();
