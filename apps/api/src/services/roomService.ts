import { db } from "../lib/db";
import { redis } from "../lib/redis";
import { rooms, roomMembers, watchSessions } from "@matinee/db";
import { eq, and } from "drizzle-orm";

export interface VideoState {
  url:         string;
  videoId:     string;
  videoTitle:  string;
  platform:    string;
  isPlaying:   boolean;
  position:    number;
  lastEventAt: number;
  leaderId:    string;
}

export async function getRoomVideoState(roomId: string): Promise<VideoState | null> {
  const raw = await redis.get(`room:${roomId}:video`);
  return raw ? JSON.parse(raw) : null;
}

export async function setRoomVideoState(roomId: string, state: VideoState) {
  await redis.setex(`room:${roomId}:video`, 86400, JSON.stringify(state));
}

export async function createRoom(data: {
  name:       string;
  leaderId:   string;
  platform:   "youtube" | "spotify" | "drive" | "web";
  videoId?:   string;
  videoTitle?: string;
  contentUrl?: string;
  visibility: "public" | "friends" | "private";
  micEnabled: boolean;
  maxMembers: number;
}) {
  const [room] = await db.insert(rooms).values({
    name:       data.name,
    leaderId:   data.leaderId,
    platform:   data.platform,
    videoId:    data.videoId,
    videoTitle: data.videoTitle,
    contentUrl: data.contentUrl,
    visibility: data.visibility,
    micEnabled: data.micEnabled,
    maxMembers: data.maxMembers,
  }).returning();

  // Add leader as first member
  await db.insert(roomMembers).values({
    roomId: room.id,
    userId: data.leaderId,
  });

  // Init video state in Redis
  if (data.videoId) {
    const initialState: VideoState = {
      url:         `https://www.youtube.com/watch?v=${data.videoId}`,
      videoId:     data.videoId,
      videoTitle:  data.videoTitle ?? "",
      platform:    data.platform,
      isPlaying:   false,
      position:    0,
      lastEventAt: Date.now(),
      leaderId:    data.leaderId,
    };
    await setRoomVideoState(room.id, initialState);
  }

  return room;
}

export async function startWatchSession(userId: string, roomId: string) {
  const [session] = await db.insert(watchSessions).values({
    userId,
    roomId,
    startedAt: new Date(),
  }).returning();
  return session;
}

export async function endWatchSession(userId: string, roomId: string) {
  const session = await db.query.watchSessions.findFirst({
    where: and(
      eq(watchSessions.userId, userId),
      eq(watchSessions.roomId, roomId),
    ),
  });
  if (!session) return;

  const durationSecs = Math.floor(
    (Date.now() - session.startedAt.getTime()) / 1000
  );

  await db.update(watchSessions)
    .set({ endedAt: new Date(), durationSecs })
    .where(eq(watchSessions.id, session.id));

  return durationSecs;
}