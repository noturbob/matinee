import { FastifyInstance } from "fastify";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { db } from "../lib/db";
import { rooms, roomMembers } from "@matinee/db";
import { eq, and, desc } from "drizzle-orm";
import { createRoom } from "../services/roomService";

const createRoomSchema = z.object({
  name:       z.string().min(1).max(50),
  platform:   z.enum(["youtube", "spotify", "drive", "web"]),
  videoId:    z.string().optional(),
  videoTitle: z.string().optional(),
  contentUrl: z.string().url().optional().or(z.literal("")),
  visibility: z.enum(["public", "friends", "private"]).default("friends"),
  micEnabled: z.boolean().default(false),
  maxMembers: z.number().min(2).max(50).default(10),
});

export async function roomRoutes(app: FastifyInstance) {

  // GET /rooms — list public/active rooms
  app.get("/rooms", { preHandler: [authenticate] }, async (req, reply) => {
    const publicRooms = await db.query.rooms.findMany({
      where: and(eq(rooms.isActive, true), eq(rooms.visibility, "public")),
      orderBy: [desc(rooms.createdAt)],
      limit: 20,
      with: { leader: true },
    });
    return reply.send({ rooms: publicRooms });
  });

  // POST /rooms — create a room
  app.post("/rooms", { preHandler: [authenticate] }, async (req, reply) => {
    const body = createRoomSchema.safeParse(req.body);
    if (!body.success) {
      return reply.status(400).send({ message: body.error.errors[0].message });
    }

    const room = await createRoom({
      ...body.data,
      leaderId: req.authUser.id,
    });

    return reply.status(201).send({ room });
  });

  // GET /rooms/:id — get room details
  app.get("/rooms/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
    });

    if (!room) return reply.status(404).send({ message: "Room not found" });
    if (!room.isActive) return reply.status(410).send({ message: "Room is closed" });

    return reply.send({ room });
  });

  // DELETE /rooms/:id — close a room (leader only)
  app.delete("/rooms/:id", { preHandler: [authenticate] }, async (req, reply) => {
    const { id } = req.params as { id: string };

    const room = await db.query.rooms.findFirst({
      where: eq(rooms.id, id),
    });

    if (!room) return reply.status(404).send({ message: "Room not found" });
    if (room.leaderId !== req.authUser.id) {
      return reply.status(403).send({ message: "Only the room leader can close it" });
    }

    await db.update(rooms).set({ isActive: false }).where(eq(rooms.id, id));

    return reply.send({ message: "Room closed" });
  });
}