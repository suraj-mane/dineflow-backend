import Redis from "ioredis";

const redis = new Redis({
  host: process.env.REDIS_HOST || "localhost",
  port: 6379,
  retryStrategy: (times) => {
    if (times > 5) return null; 
    return Math.min(times * 500, 2000); 
  },
});

redis.on("connect",  () => console.log("✅ Redis connected"));
redis.on("error",    (err) => console.error("❌ Redis error:", err.message));
redis.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));

export default redis;