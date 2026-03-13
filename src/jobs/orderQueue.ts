import { Queue } from "bullmq";

export const orderQueue = new Queue("orders", {
  connection: {
    host: process.env.REDIS_HOST || "localhost",
    port: 6379,
  },
  defaultJobOptions: {
    removeOnComplete: true,
    removeOnFail:     false,
  },
});