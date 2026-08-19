import {
  pgTable, uuid, text, integer, boolean,
  timestamp, pgEnum
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { guilds } from "./guilds";

export const platformEnum   = pgEnum("platform",   ["youtube", "spotify", "drive", "web"]);
export const visibilityEnum = pgEnum("visibility", ["public", "friends", "private"]);

export const rooms = pgTable("rooms", {
  id:         uuid("id").primaryKey().defaultRandom(),
  name:       text("name").notNull(),
  leaderId:   uuid("leader_id").references(() => users.id).notNull(),
  platform:   platformEnum("platform").default("youtube").notNull(),
  contentUrl: text("content_url"),
  videoId:    text("video_id"),
  videoTitle: text("video_title"),
  visibility: visibilityEnum("visibility").default("friends").notNull(),
  micEnabled: boolean("mic_enabled").default(false).notNull(),
  maxMembers: integer("max_members").default(10).notNull(),
  isActive:   boolean("is_active").default(true).notNull(),
  guildId:    uuid("guild_id").references(() => guilds.id),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});

export const roomMembers = pgTable("room_members", {
  roomId:   uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  userId:   uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  isMuted:  boolean("is_muted").default(false).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const roomMessages = pgTable("room_messages", {
  id:        uuid("id").primaryKey().defaultRandom(),
  roomId:    uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content:   text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});