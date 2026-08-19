import {
  pgTable, uuid, text, integer, boolean,
  timestamp, pgEnum, real
} from "drizzle-orm/pg-core";
import { users } from "./users";
import { rooms } from "./rooms";

export const xpReasonEnum = pgEnum("xp_reason", [
  "watch", "login", "chat", "friend", "event", "ad_watch"
]);

export const xpLog = pgTable("xp_log", {
  id:        uuid("id").primaryKey().defaultRandom(),
  userId:    uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  amount:    integer("amount").notNull(),
  reason:    xpReasonEnum("reason").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const watchSessions = pgTable("watch_sessions", {
  id:           uuid("id").primaryKey().defaultRandom(),
  userId:       uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  roomId:       uuid("room_id").references(() => rooms.id, { onDelete: "cascade" }).notNull(),
  startedAt:    timestamp("started_at").defaultNow().notNull(),
  endedAt:      timestamp("ended_at"),
  durationSecs: integer("duration_secs").default(0).notNull(),
});

export const rarityEnum = pgEnum("rarity", ["common", "rare", "epic", "legendary"]);

export const badges = pgTable("badges", {
  id:          uuid("id").primaryKey().defaultRandom(),
  name:        text("name").notNull(),
  description: text("description"),
  imageUrl:    text("image_url").notNull(),
  rarity:      rarityEnum("rarity").default("common").notNull(),
  isActive:    boolean("is_active").default(true).notNull(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const userBadges = pgTable("user_badges", {
  userId:      uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  badgeId:     uuid("badge_id").references(() => badges.id).notNull(),
  earnedAt:    timestamp("earned_at").defaultNow().notNull(),
  isDisplayed: boolean("is_displayed").default(false).notNull(),
});