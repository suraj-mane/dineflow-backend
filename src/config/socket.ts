import { Server, Socket } from "socket.io";
import logger from "../utils/logger";

let io: Server;

export const initSocket = (server: any): void => {
  io = new Server(server, {
    cors: {
      origin:      process.env.CORS_ORIGIN?.split(",") || "http://localhost:3000",
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on("join-restaurant", (restaurantId: number) => {
      socket.join(`restaurant_${restaurantId}`);
      logger.info(`Socket ${socket.id} joined restaurant_${restaurantId}`);
    });

    socket.on("disconnect", () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });
};

export const getIO = (): Server => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};