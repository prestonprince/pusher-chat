import { text, sqliteTable } from "drizzle-orm/sqlite-core";

export const messages = sqliteTable("messages", {
  id: text("id").primaryKey(),
  message: text("message"),
  senderId: text("sender_id"),
  status: text("status"),
  senderName: text("sender_name"),
});
