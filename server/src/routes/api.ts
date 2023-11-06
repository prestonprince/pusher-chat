import Router from "koa-router";
import Koa from "koa";

import { MessageRoutes } from "./message.routes";
import { TeamRoutes } from "./team.routes";
import { UserRoutes } from "./user.routes";
import { PusherRoutes } from "./pusher.routes";

const router = new Router({ prefix: "/api" });

router.get("/healthcheck", async (ctx: Koa.Context) => {
  ctx.status = 200;
  ctx.body = { status: "ok" };
});

router.use(MessageRoutes);
router.use(TeamRoutes);
router.use(UserRoutes);
router.use(PusherRoutes);

export const ApiRouter = router.routes();
