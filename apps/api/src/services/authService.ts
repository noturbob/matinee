import bcrypt from "bcryptjs";
import { db } from "../lib/db";
import { redis } from "../lib/redis";
import { users } from "@matinee/db";
import { eq } from "drizzle-orm";

export const XP_THRESHOLDS = [0, 500, 1500, 3500, 7500, 15000, 27500, 45000, 70000, 100000];

export function getLevelFromXp(xp: number): number {
  for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
    if (xp >= XP_THRESHOLDS[i]) return i + 1;
  }
  return 1;
}

export async function registerUser(data: {
  username: string;
  email: string;
  password: string;
}) {
  // Check if username/email taken
  const existing = await db.query.users.findFirst({
    where: eq(users.email, data.email),
  });
  if (existing) throw new Error("Email already in use");

  const existingUsername = await db.query.users.findFirst({
    where: eq(users.username, data.username),
  });
  if (existingUsername) throw new Error("Username already taken");

  const passwordHash = await bcrypt.hash(data.password, 12);

  const [user] = await db.insert(users).values({
    username:    data.username,
    displayName: data.username,
    email:       data.email,
    // store hash in a separate auth table in production
    // for now Supabase Auth handles this
  }).returning();

  return user;
}

export async function enforceOneSession(
  userId: string,
  socketId: string | null,
  io: any
) {
  const key = `session:${userId}`;
  const existing = await redis.get(key);

  if (existing) {
    const session = JSON.parse(existing);
    if (session.socketId && io) {
      io.to(session.socketId).emit("force_logout", {
        reason: "Signed in from another device",
      });
    }
  }

  await redis.setex(
    key,
    86400 * 30,
    JSON.stringify({ userId, socketId, createdAt: Date.now() })
  );
}

export async function clearSession(userId: string) {
  await redis.del(`session:${userId}`);
}