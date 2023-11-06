import { text, sqliteTable } from "drizzle-orm/sqlite-core";

import { teams } from "./teams";

export const teamMembers = sqliteTable("team_members", {
  id: text("id").primaryKey(),
  userId: text("user_id"),
  teamId: text("team_id").references(() => teams.id),
});
