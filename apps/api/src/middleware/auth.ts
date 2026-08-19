import { FastifyRequest, FastifyReply } from "fastify";
import { db } from "../lib/db";
import { users } from "@matinee/db";
import { eq } from "drizzle-orm";

export async function authenticate(req: FastifyRequest, reply: FastifyReply) {
  try {
    await req.jwtVerify();
    const payload = req.user as { userId: string };

    const user = await db.query.users.findFirst({
      where: eq(users.id, payload.userId),
    });

    if (!user) {
      return reply.status(401).send({ message: "User not found" });
    }

    req.authUser = user;
  } catch {
    return reply.status(401).send({ message: "Invalid or expired token" });
  }
}

// Extend FastifyRequest type
declare module "fastify" {
  interface FastifyRequest {
    authUser: typeof users.$inferSelect;
  }
}