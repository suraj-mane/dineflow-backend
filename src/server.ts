import dotenv from "dotenv";
dotenv.config();

import http from "http";
import { testConnection } from "./config/database";
import { initSocket } from "./config/socket";
import logger from "./utils/logger";
import app from "./app";

// ── Startup env validation ────────────────────────────────────────────────────
const REQUIRED = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME", "JWT_SECRET", "REDIS_HOST"];

for (const key of REQUIRED) {
    if (!process.env[key]) {
        logger.error(`Missing required env variable: ${key}`);
        process.exit(1);
    }
}

if (process.env.JWT_SECRET!.length < 32) {
    logger.error("JWT_SECRET must be at least 32 characters");
    process.exit(1);
}

// ── Bootstrap ────────────────────────────────────────────────────────────────
const PORT = Number(process.env.PORT) || 5000;
const server = http.createServer(app);

initSocket(server);

const startServer = async () => {
    try {
        await testConnection();
        logger.info("✅ Database connected");

        server.listen(PORT, () => {
            logger.info(`🚀 Server running on port ${PORT}`);
        });
    } catch (err) {
        logger.error("❌ Failed to start server", { err });
        process.exit(1);
    }
};

// ── Graceful shutdown ────────────────────────────────────────────────────────
process.on("SIGTERM", () => {
    logger.info("SIGTERM received — shutting down");
    server.close(() => process.exit(0));
});

process.on("SIGINT", () => {
    logger.info("SIGINT received — shutting down");
    server.close(() => process.exit(0));
});

process.on("uncaughtException", (err) => { logger.error("Uncaught exception", { err }); process.exit(1); });
process.on("unhandledRejection", (reason) => { logger.error("Unhandled rejection", { reason }); process.exit(1); });

startServer();