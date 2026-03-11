import { Router } from "express";
import { register, login, refresh, logout, getMe } from "./auth.controller";
import { authenticate } from "../../middleware/auth.middleware";
import { authLimiter }  from "../../middleware/rateLimit.middleware";

const router = Router();

// Public routes
router.post("/register", authLimiter, register);
router.post("/login",    authLimiter, login);
router.post("/refresh",  refresh);

// Protected routes
router.post("/logout", authenticate, logout);
router.get("/me",      authenticate, getMe);

export default router;