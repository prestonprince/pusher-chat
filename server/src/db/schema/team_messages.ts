import { sqliteTable, text } from "drizzle-orm/sqlite-core";

import { messages } from "./messages";
import { teams } from "./teams";

export const teamMessages = sqliteTable("team_messages", {
  id: text("id").primaryKey(),
  messageId: text("message_id").references(() => messages.id),
  teamId: text("team_id").references(() => teams.id),
  readBy: text("read_by"),
});
