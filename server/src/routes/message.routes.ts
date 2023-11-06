import Router from "koa-router";
import Koa from "koa";
import Pusher from "pusher";
import { v4 as uuidv4 } from "uuid";

export const pusher = new Pusher({
  appId: "1697242",
  key: "e2ba268a03202df31b4e",
  secret: "bf47b93d58be56a88b6b",
  cluster: "mt1",
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
