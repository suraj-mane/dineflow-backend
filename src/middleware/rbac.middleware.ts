import { NextFunction, Request, Response } from "express";
import { errorResponse } from "../utils/response";

export const authorize = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return errorResponse(res, "Unauthorized", 401);
    }
    if (!roles.includes(req.user.role)) {
      return errorResponse(res, "Forbidden: Access denied", 403);
    }
    next();
  };
};