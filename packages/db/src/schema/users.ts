import {
  pgTable, uuid, text, integer, boolean,
  timestamp, pgEnum
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id:           uuid("id").primaryKey().defaultRandom(),
  username:     text("username").unique().notNull(),
  displayName:  text("display_name").notNull(),
  email:        text("email").unique().notNull(),
  avatarUrl:    text("avatar_url"),
  bio:          text("bio"),
  level:        integer("level").default(1).notNull(),
  xp:           integer("xp").default(0).notNull(),
  isPremium:    boolean("is_premium").default(false).notNull(),
  premiumUntil: timestamp("premium_until"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

export const friendStatusEnum = pgEnum("friend_status", ["pending", "accepted", "rejected"]);

export const friendRequests = pgTable("friend_requests", {
  fromUserId: uuid("from_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  toUserId:   uuid("to_user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  status:     friendStatusEnum("status").default("pending").notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
});