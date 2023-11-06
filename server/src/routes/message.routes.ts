import Router from "koa-router";
import Koa from "koa";
import Pusher from "pusher";
import { v4 as uuidv4 } from "uuid";
import dotenv from "dotenv";

dotenv.config();

export const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID ?? "",
  key: process.env.PUSHER_KEY ?? "",
  secret: process.env.PUSHER_SECRET ?? "",
  cluster: process.env.PUSHER_CLUSTER ?? "",
});

const router = new Router({ prefix: "/message" });

router.get("/", async (ctx: Koa.Context) => {
  ctx.status = 200;
  ctx.body = { message: "hello world!" };
});

router.post("/", async (ctx: Koa.Context) => {
  const { message, senderId } = ctx.request.body;
  await pusher.trigger("message_channel", "new_message", {
    message,
    senderId,
    id: uuidv4(),
    status: "sent",
  });

  ctx.status = 201;
  ctx.body = { status: "sent" };
});

router.patch("/:id", async (ctx: Koa.Context) => {
  const { status, senderId } = ctx.request.body;
  const id = ctx.params.id;
  console.log(id);
  await pusher.trigger("message_channel", "status_update", {
    status,
    id,
    senderId,
  });

  ctx.status = 200;
  ctx.body = { status };
});

export const MessageRoutes = router.routes();
