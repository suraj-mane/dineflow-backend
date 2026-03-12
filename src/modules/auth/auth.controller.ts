import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { successResponse, errorResponse } from "../../utils/response";
import { registerSchema, loginSchema } from "./auth.validation";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getUserById,
} from "./auth.service";


export const register = asyncHandler(async (req: Request, res: Response) => {
  const data = registerSchema.parse(req.body);
  const result = await registerUser(data);
  return successResponse(res, "User registered successfully", result, 201);
});


export const login = asyncHandler(async (req: Request, res: Response) => {
  const data = loginSchema.parse(req.body);
  const result = await loginUser(data);
  return successResponse(res, "Login successful", result);
});


export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return errorResponse(res, "Refresh token is required", 400);
  }
  const result = await refreshAccessToken(refreshToken);
  return successResponse(res, "Token refreshed successfully", result);
});


export const logout = asyncHandler(async (req: Request, res: Response) => {
  await logoutUser(req.user.id);
  return successResponse(res, "Logged out successfully");
});


export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await getUserById(req.user.id);
  return successResponse(res, "User fetched successfully", user);
});