import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../utils/jwt";
import logger from "../utils/logger";

let io: Server;

export const initSocket = (server: any): void => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
      credentials: true,
    },
  });

  // ── JWT Auth Middleware ──────────────────────────────────────────────────
  io.use((socket: Socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.replace("Bearer ", "");

      if (!token) {
        return next(new Error("Authentication token missing"));
      }

      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  // ── Connection Handler ───────────────────────────────────────────────────
  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;
    logger.info(`Socket connected: ${socket.id} | user: ${user.id} | role: ${user.role}`);

    // Join restaurant room — only owners and kitchen staff
    socket.on("join-restaurant", (restaurantId: number) => {
      if (!["owner", "kitchen", "admin"].includes(user.role)) {
        socket.emit("error", { message: "Not authorized to join restaurant room" });
        return;
      }
      socket.join(`restaurant_${restaurantId}`);
      logger.info(`Socket ${socket.id} joined restaurant_${restaurantId}`);
      socket.emit("joined", { room: `restaurant_${restaurantId}` });
    });

    // Join customer room — for tracking own orders
    socket.on("join-customer", () => {
      socket.join(`customer_${user.id}`);
      logger.info(`Socket ${socket.id} joined customer_${user.id}`);
      socket.emit("joined", { room: `customer_${user.id}` });
    });

    // Leave room
    socket.on("leave-restaurant", (restaurantId: number) => {
      socket.leave(`restaurant_${restaurantId}`);
      logger.info(`Socket ${socket.id} left restaurant_${restaurantId}`);
    });

    socket.on("disconnect", (reason) => {
      logger.info(`Socket disconnected: ${socket.id} | reason: ${reason}`);
    });

    socket.on("error", (err) => {
      logger.error(`Socket error: ${socket.id}`, { err });
    });
  });
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};

// ── Emit Helpers ─────────────────────────────────────────────────────────────
export const emitToRestaurant = (
  restaurantId: number,
  event:        string,
  data:         unknown
): void => {
  try {
    getIO().to(`restaurant_${restaurantId}`).emit(event, data);
  } catch {
    logger.warn(`Could not emit ${event} to restaurant_${restaurantId}`);
  }
};

export const emitToCustomer = (
  customerId: number,
  event:      string,
  data:       unknown
): void => {
  try {
    getIO().to(`customer_${customerId}`).emit(event, data);
  } catch {
    logger.warn(`Could not emit ${event} to customer_${customerId}`);
  }
};