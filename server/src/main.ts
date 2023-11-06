import Koa from "koa";
import dotenv from "dotenv";
import cors from "@koa/cors";
import json from "koa-json";
import http from "http";
import * as koaBody from "koa-body";
import Redis from "ioredis";

import { ApiRouter } from "./routes/api";

dotenv.config();

const PORT = parseInt(process.env.PORT || "3000", 10);
const REDIS_URL = process.env.UPSTASH_REDIS_URL;

if (!REDIS_URL) {
  console.error("missing redis url");
  process.exit(1);
}

export const messageCache = new Redis(REDIS_URL);

messageCache.on("error", (err) => {
  console.error(err);
});

messageCache.on("connect", () => {
  console.log("Redis Message Cache Connected");
});

const app = new Koa();

app.use(cors());
app.use(koaBody.koaBody());
app.use(json());

app.use(ApiRouter);
const server = http.createServer(app.callback());

server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});

process.on("beforeExit", async () => {
  await messageCache.disconnect();
});
