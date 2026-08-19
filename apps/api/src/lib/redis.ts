import Redis from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  retryStrategy: (times) => Math.min(times * 100, 2000),
});

redis.on("error", (err) => console.error("[Redis]", err.message));
redis.on("connect", () => console.log("[Redis] Connected"));