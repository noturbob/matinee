import { pgTable, uuid, text, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { real } from "drizzle-orm/pg-core";
import { users } from "./users";

export const guilds = pgTable("guilds", {
  id:              uuid("id").primaryKey().defaultRandom(),
  name:            text("name").unique().notNull(),
  description:     text("description"),
  avatarUrl:       text("avatar_url"),
  ownerId:         uuid("owner_id").references(() => users.id).notNull(),
  maxMembers:      integer("max_members").default(10).notNull(),
  isPublic:        boolean("is_public").default(true).notNull(),
  totalWatchHours: real("total_watch_hours").default(0).notNull(),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
});

export const guildRoleEnum = pgEnum("guild_role", ["leader", "officer", "member"]);

export const guildMembers = pgTable("guild_members", {
  guildId:  uuid("guild_id").references(() => guilds.id, { onDelete: "cascade" }).notNull(),
  userId:   uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role:     guildRoleEnum("role").default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});