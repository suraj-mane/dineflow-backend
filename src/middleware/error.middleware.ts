import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors:  err.issues.map((e) => ({ field: e.path.join("."), message: e.message })),
    });
  }

  const status  = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  logger.error(message, { url: req.originalUrl, method: req.method, status });

  res.status(status).json({
    success: false,
    message: status === 500 ? "Internal Server Error" : message,
  });
};