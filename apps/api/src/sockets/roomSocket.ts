import { Server, Socket } from "socket.io";
import { db } from "../lib/db";
import { redis } from "../lib/redis";
import { rooms, roomMembers, users } from "@matinee/db";
import { eq, and } from "drizzle-orm";
import {
  getRoomVideoState, setRoomVideoState,
  startWatchSession, endWatchSession,
  type VideoState,
} from "../services/roomService";
import { awardXp } from "../services/xpService";

interface AuthSocket extends Socket {
  userId: string;
  user: typeof users.$inferSelect;
}

export function registerRoomHandlers(io: Server, socket: AuthSocket) {

  // JOIN ROOM
  socket.on("room:join", async ({ roomId }: { roomId: string }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || !room.isActive) {
      socket.emit("error", { message: "Room not found or closed" });
      return;
    }

    // Check capacity
    const memberCount = await redis.scard(`room:${roomId}:members`);
    if (memberCount >= room.maxMembers) {
      socket.emit("error", { message: "Room is full" });
      return;
    }

    // Join socket room
    socket.join(`room:${roomId}`);

    // Track in Redis
    await redis.sadd(`room:${roomId}:members`, socket.userId);
    await redis.setex(`socket:${socket.id}:room`, 86400, roomId);

    // Upsert room_members
    await db.insert(roomMembers)
      .values({ roomId, userId: socket.userId })
      .onConflictDoNothing();

    // Start watch session
    await startWatchSession(socket.userId, roomId);

    // Build member list
    const memberIds = await redis.smembers(`room:${roomId}:members`);
    const memberList = await Promise.all(
      memberIds.map(async (uid) => {
        const u = await db.query.users.findFirst({ where: eq(users.id, uid) });
        if (!u) return null;
        return {
          id:          u.id,
          username:    u.username,
          displayName: u.displayName,
          avatarUrl:   u.avatarUrl,
          isMuted:     false,
          isLeader:    uid === room.leaderId,
        };
      })
    ).then((list) => list.filter(Boolean));

    // Send current state to the joining user
    const videoState = await getRoomVideoState(roomId);
    socket.emit("room:state", {
      members:    memberList,
      videoState,
      micEnabled: room.micEnabled,
    });

    // Tell everyone else this user joined
    socket.to(`room:${roomId}`).emit("room:join", {
      id:          socket.user.id,
      username:    socket.user.username,
      displayName: socket.user.displayName,
      avatarUrl:   socket.user.avatarUrl,
      isMuted:     false,
      isLeader:    socket.userId === room.leaderId,
    });
  });

  // LEAVE ROOM
  socket.on("room:leave", async ({ roomId }: { roomId: string }) => {
    await handleLeaveRoom(io, socket, roomId);
  });

  // VIDEO PLAY
  socket.on("video:play", async ({ roomId, position }: { roomId: string; position: number }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return; // only leader

    const current = await getRoomVideoState(roomId);
    if (!current) return;

    const state: VideoState = {
      ...current,
      isPlaying:   true,
      position,
      lastEventAt: Date.now(),
    };
    await setRoomVideoState(roomId, state);
    io.to(`room:${roomId}`).emit("video:play", state);
  });

  // VIDEO PAUSE
  socket.on("video:pause", async ({ roomId, position }: { roomId: string; position: number }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return;

    const current = await getRoomVideoState(roomId);
    if (!current) return;

    const state: VideoState = {
      ...current,
      isPlaying:   false,
      position,
      lastEventAt: Date.now(),
    };
    await setRoomVideoState(roomId, state);
    io.to(`room:${roomId}`).emit("video:pause", state);
  });

  // VIDEO SEEK
  socket.on("video:seek", async ({ roomId, position }: { roomId: string; position: number }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return;

    const current = await getRoomVideoState(roomId);
    if (!current) return;

    const state: VideoState = { ...current, position, lastEventAt: Date.now() };
    await setRoomVideoState(roomId, state);
    io.to(`room:${roomId}`).emit("video:seek", state);
  });

  // CHANGE VIDEO
  socket.on("video:change", async ({ roomId, videoId, videoTitle }: {
    roomId: string; videoId: string; videoTitle: string;
  }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return;

    // Update DB
    await db.update(rooms)
      .set({ videoId, videoTitle })
      .where(eq(rooms.id, roomId));

    const state: VideoState = {
      url:         `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      videoTitle,
      platform:    "youtube",
      isPlaying:   false,
      position:    0,
      lastEventAt: Date.now(),
      leaderId:    socket.userId,
    };
    await setRoomVideoState(roomId, state);
    io.to(`room:${roomId}`).emit("video:change", state);
  });

  // CHAT MESSAGE
  socket.on("chat:message", async ({ roomId, content }: { roomId: string; content: string }) => {
    if (!content?.trim() || content.length > 500) return;

    const msg = {
      id:          crypto.randomUUID(),
      userId:      socket.user.id,
      username:    socket.user.username,
      displayName: socket.user.displayName,
      avatarUrl:   socket.user.avatarUrl,
      content:     content.trim(),
      createdAt:   new Date().toISOString(),
    };

    io.to(`room:${roomId}`).emit("chat:message", msg);

    // XP for chatting (rate-limited inside awardXp)
    await awardXp(socket.userId, "chat", 5).catch(() => {});
  });

  // KICK MEMBER
  socket.on("room:kick", async ({ roomId, userId }: { roomId: string; userId: string }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return;

    io.to(`room:${roomId}`).emit("room:kick", { userId });

    await redis.srem(`room:${roomId}:members`, userId);
    await db.delete(roomMembers).where(
      and(eq(roomMembers.roomId, roomId), eq(roomMembers.userId, userId))
    );
  });

  // MIC TOGGLE (leader only)
  socket.on("room:mic_toggle", async ({ roomId, enabled }: { roomId: string; enabled: boolean }) => {
    const room = await db.query.rooms.findFirst({ where: eq(rooms.id, roomId) });
    if (!room || room.leaderId !== socket.userId) return;

    await db.update(rooms).set({ micEnabled: enabled }).where(eq(rooms.id, roomId));
    io.to(`room:${roomId}`).emit("room:mic_toggle", { enabled });
  });

  // DISCONNECT
  socket.on("disconnect", async () => {
    const roomId = await redis.get(`socket:${socket.id}:room`);
    if (roomId) {
      await handleLeaveRoom(io, socket, roomId);
      await redis.del(`socket:${socket.id}:room`);
    }
    await redis.del(`session:${socket.userId}`);
  });
}

async function handleLeaveRoom(io: Server, socket: AuthSocket, roomId: string) {
  socket.leave(`room:${roomId}`);
  await redis.srem(`room:${roomId}:members`, socket.userId);

  // End watch session + award XP
  const duration = await endWatchSession(socket.userId, roomId);
  if (duration && duration >= 60) {
    const hours = duration / 3600;
    const xp = Math.floor(hours * 100);
    if (xp > 0) await awardXp(socket.userId, "watch", xp);
  }

  io.to(`room:${roomId}`).emit("room:leave", { userId: socket.userId });
}