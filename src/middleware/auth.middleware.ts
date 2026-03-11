import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { errorResponse } from "../utils/response";

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return errorResponse(res, "Authorization token missing", 401);
  }

  const token = authHeader.split(" ")[1];

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    return errorResponse(res, "Invalid or expired token", 401);
  }
};