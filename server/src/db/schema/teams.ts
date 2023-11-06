import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const teams = sqliteTable("teams", {
  id: text("id").primaryKey(),
  name: text("name"),
  creatorId: text("creator_id"),
});
