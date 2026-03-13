import dotenv from "dotenv";
dotenv.config();

import { Worker, Job } from "bullmq";
import { db } from "../config/database";
import logger  from "../utils/logger";

const worker = new Worker(
  "orders",
  async (job: Job) => {
    if (job.name === "auto-cancel") {
      const { orderId, restaurantId } = job.data;

      // Only cancel if still pending
      const [rows]: any = await db.execute(
        "SELECT status FROM orders WHERE id = ?",
        [orderId]
      );

      if (rows.length > 0 && rows[0].status === "pending") {
        await db.execute(
          "UPDATE orders SET status = 'cancelled' WHERE id = ?",
          [orderId]
        );
        logger.info(`Auto-cancelled order #${orderId} (restaurant ${restaurantId})`);
      }
    }
  },
  {
    connection: {
      host: process.env.REDIS_HOST || "localhost",
      port: 6379,
    },
  }
);

worker.on("completed", (job) =>
  logger.info(`Job ${job.id} completed`)
);

worker.on("failed", (job, err) =>
  logger.error(`Job ${job?.id} failed: ${err.message}`)
);

worker.on("error", (err) =>
  logger.error("Worker error:", { err })
);

logger.info("🔧 Order worker started");

export default worker;