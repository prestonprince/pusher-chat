import { Config } from "drizzle-kit";

const URL = process.env.DATABASE_URL ?? "";

export default {
  schema: "./src/db/schema/*.ts",
  out: ".migrations",
  driver: "turso",
  dbCredentials: {
    url: URL,
  },
} satisfies Config;
