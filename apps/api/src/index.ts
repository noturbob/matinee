import "dotenv/config";
import Fastify from "fastify";
import cors from "@fastify/cors";
import jwt from "@fastify/jwt";
import cookie from "@fastify/cookie";
import rateLimit from "@fastify/rate-limit";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redis } from "./lib/redis";
import { authRoutes } from "./routes/auth";
import { roomRoutes } from "./routes/rooms";
import { registerRoomHandlers } from "./sockets/roomSocket";
import { db } from "./lib/db";
import { users } from "@matinee/db";
import { eq } from "drizzle-orm";

const app = Fastify({ logger: { level: "info" } });

async function bootstrap() {
  // ── Plugins ──────────────────────────────────────────────────

  await app.register(cors, {
    origin:      process.env.CLIENT_URL ?? "http://localhost:3000",
    credentials: true,
    methods:     ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET!,
  });

  await app.register(cookie);

  await app.register(rateLimit, {
    max:       100,
    timeWindow: "1 minute",
  });

  // Expose authenticate as app.authenticate
  app.decorate("authenticate", async (req: any, reply: any) => {
    try {
      await req.jwtVerify();
    } catch {
      reply.status(401).send({ message: "Unauthorized" });
    }
  });

  // ── Routes ────────────────────────────────────────────────────

  await app.register(authRoutes, { prefix: "/" });
  await app.register(roomRoutes, { prefix: "/" });

  app.get("/health", async () => ({ status: "ok", timestamp: new Date().toISOString() }));

  // ── Socket.io ────────────────────────────────────────────────

  const io = new Server(app.server, {
    cors: {
      origin:      process.env.CLIENT_URL ?? "http://localhost:3000",
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Redis adapter for multi-instance
  const pubClient = redis;
  const subClient = redis.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Socket auth middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) throw new Error("No token");

      const payload = app.jwt.verify(token) as { userId: string };
      const user = await db.query.users.findFirst({
        where: eq(users.id, payload.userId),
      });

      if (!user) throw new Error("User not found");

      (socket as any).userId = user.id;
      (socket as any).user   = user;

      // Enforce single session
      const sessionKey = `session:${user.id}`;
      const existing   = await redis.get(sessionKey);
      if (existing) {
        const session = JSON.parse(existing);
        if (session.socketId && session.socketId !== socket.id) {
          io.to(session.socketId).emit("force_logout", {
            reason: "Signed in from another device",
          });
        }
      }
      await redis.setex(sessionKey, 86400 * 30, JSON.stringify({
        userId: user.id, socketId: socket.id, createdAt: Date.now(),
      }));

      next();
    } catch (err: any) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    app.log.info(`Socket connected: ${socket.id}`);
    registerRoomHandlers(io, socket as any);
  });

  // ── Start ────────────────────────────────────────────────────

  const port = parseInt(process.env.PORT ?? "4000");
  await app.listen({ port, host: "0.0.0.0" });
  console.log(`\n🚀 API running at http://localhost:${port}`);
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});