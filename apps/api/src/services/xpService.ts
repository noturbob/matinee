import { db } from "../lib/db";
import { xpLog, users } from "@matinee/db";
import { eq } from "drizzle-orm";
import { getLevelFromXp } from "./authService";

type XpReason = "watch" | "login" | "chat" | "friend" | "event" | "ad_watch";

const XP_AMOUNTS: Record<XpReason, number> = {
  login:    50,
  chat:     5,
  friend:   25,
  event:    100,
  ad_watch: 30,
  watch:    100,   // per hour
};

export async function awardXp(userId: string, reason: XpReason, override?: number) {
  const amount = override ?? XP_AMOUNTS[reason];

  // Log the XP event
  await db.insert(xpLog).values({ userId, amount, reason });

  // Update user's XP and level
  const user = await db.query.users.findFirst({ where: eq(users.id, userId) });
  if (!user) return;

  const newXp    = user.xp + amount;
  const newLevel = getLevelFromXp(newXp);

  await db.update(users)
    .set({ xp: newXp, level: newLevel, updatedAt: new Date() })
    .where(eq(users.id, userId));

  return { newXp, newLevel, leveledUp: newLevel > user.level };
}

export async function checkDailyLogin(userId: string): Promise<boolean> {
  const key   = `daily_login:${userId}`;
  const exists = await import("../lib/redis").then(({ redis }) => redis.get(key));
  if (exists) return false;

  // Mark as done for today (expires at midnight)
  const now        = new Date();
  const midnight   = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  const ttl = Math.floor((midnight.getTime() - now.getTime()) / 1000);

  const { redis } = await import("../lib/redis");
  await redis.setex(key, ttl, "1");
  await awardXp(userId, "login");
  return true;
}