import { FastifyInstance } from "fastify";
import { z } from "zod";
import { supabase } from "../lib/supabase";
import { db } from "../lib/db";
import { users } from "@matinee/db";
import { eq } from "drizzle-orm";
import { enforceOneSession, clearSession } from "../services/authService";
import { checkDailyLogin } from "../services/xpService";

const registerSchema = z.object({
  username: z.string().min(3).max(20).regex(/^[a-zA-Z0-9_]+$/),
  email:    z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
});

export async function authRoutes(app: FastifyInstance) {

  // POST /auth/register
  app.post("/auth/register", async (req, reply) => {
    const body = registerSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: body.error.errors[0].message });
    }

    const { username, email, password } = body.data;

    // Create auth user via Supabase
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      return reply.status(400).send({ message: authError.message });
    }

    // Check username taken
    const existingUser = await db.query.users.findFirst({
      where: eq(users.username, username),
    });
    if (existingUser) {
      await supabase.auth.admin.deleteUser(authData.user.id);
      return reply.status(400).send({ message: "Username already taken" });
    }

    // Create profile row
    const [user] = await db.insert(users).values({
      id:          authData.user.id,
      username,
      displayName: username,
      email,
    }).returning();

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign({ userId: user.id, type: "refresh" }, { expiresIn: "30d" });

    await enforceOneSession(user.id, null, null);

    return reply
      .setCookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   86400 * 30,
        path:     "/",
      })
      .send({ user, token });
  });

  // POST /auth/login
  app.post("/auth/login", async (req, reply) => {
    const body = loginSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: "Invalid input" });
    }

    const { email, password } = body.data;

    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !authData.user) {
      return reply.status(401).send({ message: "Invalid email or password" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, authData.user.id),
    });

    if (!user) {
      return reply.status(404).send({ message: "User profile not found" });
    }

    const token = app.jwt.sign({ userId: user.id }, { expiresIn: "15m" });
    const refreshToken = app.jwt.sign(
      { userId: user.id, type: "refresh" },
      { expiresIn: "30d" }
    );

    await enforceOneSession(user.id, null, null);
    await checkDailyLogin(user.id);

    return reply
      .setCookie("refresh_token", refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge:   86400 * 30,
        path:     "/",
      })
      .send({ user, token });
  });

  // POST /auth/refresh
  app.post("/auth/refresh", async (req, reply) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
      return reply.status(401).send({ message: "No refresh token" });
    }

    try {
      const payload = app.jwt.verify(refreshToken) as { userId: string; type: string };
      if (payload.type !== "refresh") throw new Error("Not a refresh token");

      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });
      if (!user) throw new Error("User not found");

      const newToken = app.jwt.sign({ userId: user.id }, { expiresIn: "15m" });
      const newRefresh = app.jwt.sign(
        { userId: user.id, type: "refresh" },
        { expiresIn: "30d" }
      );

      return reply
        .setCookie("refresh_token", newRefresh, {
          httpOnly: true,
          secure:   process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge:   86400 * 30,
          path:     "/",
        })
        .send({ token: newToken, user });
    } catch {
      return reply.status(401).send({ message: "Invalid refresh token" });
    }
  });

  // POST /auth/logout
  app.post("/auth/logout", async (req, reply) => {
    try {
      const payload = app.jwt.verify(
        req.headers.authorization?.replace("Bearer ", "") ?? ""
      ) as { userId: string };
      await clearSession(payload.userId);
    } catch {}

    return reply
      .clearCookie("refresh_token", { path: "/" })
      .send({ message: "Logged out" });
  });

  // GET /auth/me
  app.get("/auth/me", { preHandler: [app.authenticate] }, async (req, reply) => {
    return reply.send({ user: req.authUser });
  });
}