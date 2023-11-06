import Koa from "koa";
import Router from "koa-router";
import { pusher } from "./message.routes";

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

  const user = {
    id,
    user_info: {
      ...rest,
    },
    // watchlist:
    //   id === "kp_62bd825178664ff591e0d0f5b7d4ce12"
    //     ? ["kp_f0f198473d6a451c9a802b9760949939"]
    //     : ["kp_62bd825178664ff591e0d0f5b7d4ce12"],
  };

  const authResponse = pusher.authenticateUser(socketId, user);
  ctx.status = 200;
  ctx.body = authResponse;
});

export const PusherRoutes = router.routes();
