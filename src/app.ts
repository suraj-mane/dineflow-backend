import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler } from "./middleware/error.middleware";
import { generalLimiter } from "./middleware/rateLimit.middleware";
import authRoutes from "./modules/auth/auth.routes";
import restaurantRoutes from "./modules/restaurant/restaurant.routes";
import categoryRoutes from "./modules/category/category.routes";
import menuItemRoutes from "./modules/menu-item/menuItem.routes";
import { db } from "./config/database";
import redis from "./config/redis";
import { authenticate } from "./middleware/auth.middleware";
import { getRestaurantOrdersController } from "./modules/order/order.controller";
import orderRoutes from "./modules/order/order.routes";

const app = express();

// ── Core middleware ──────────────────────────────────────────────────────────
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
    credentials: true,
}));
app.use(helmet());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);

// ── Health check ─────────────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
    let dbStatus = "disconnected";
    let redisStatus = "disconnected";

    try { await db.getConnection().then(c => { c.ping(); c.release(); }); dbStatus = "connected"; } catch { }
    try { await redis.ping(); redisStatus = "connected"; } catch { }

    const ok = dbStatus === "connected" && redisStatus === "connected";

    res.status(ok ? 200 : 503).json({
        status: ok ? "OK" : "DEGRADED",
        services: { database: dbStatus, redis: redisStatus },
        timestamp: new Date().toISOString(),
    });
});

// ── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/restaurants", restaurantRoutes);
app.use("/api", categoryRoutes);
app.use("/api", menuItemRoutes);
app.use("/api/orders", orderRoutes);

// Restaurant-scoped order listing
app.use("/api/restaurants/:restaurantId/orders", authenticate, (req,_res, next) => {
    (req as any).restaurantIdParam = req.params.restaurantId;
    next();
}, getRestaurantOrdersController);

// ── Error handler — MUST be last ─────────────────────────────────────────────
app.use(errorHandler);

export default app;