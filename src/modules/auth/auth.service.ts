import bcrypt  from "bcrypt";
import { db }  from "../../config/database";
import redis   from "../../config/redis";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../../utils/jwt";
import { LoginInput, RegisterInput } from "./auth.types";

const REFRESH_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

// ── Register ─────────────────────────────────────────────────────────────────
export const registerUser = async (data: RegisterInput) => {
  const { firstName, lastName, email, password, role } = data;

  // Check duplicate email
  const [existing]: any = await db.execute(
    "SELECT id FROM users WHERE email = ?",
    [email]
  );
  if (existing.length > 0) {
    const err: any = new Error("Email already in use");
    err.status = 409;
    throw err;
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const [result]: any = await db.execute(
    `INSERT INTO users (first_name, last_name, email, password, role)
     VALUES (?, ?, ?, ?, ?)`,
    [firstName, lastName, email, hashedPassword, role]
  );

  return {
    id:    result.insertId,
    email,
    role,
  };
};

// ── Login ─────────────────────────────────────────────────────────────────────
export const loginUser = async (data: LoginInput) => {
  const { email, password } = data;

  const [rows]: any = await db.execute(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );

  if (rows.length === 0) {
    const err: any = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const user = rows[0];

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err: any = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const accessToken  = generateAccessToken({ id: user.id, role: user.role });
  const refreshToken = generateRefreshToken({ id: user.id, role: user.role });

  // Store refresh token in Redis
  await redis.set(`refresh:${user.id}`, refreshToken, "EX", REFRESH_TTL);

  return {
    user: {
      id:        user.id,
      firstName: user.first_name,
      lastName:  user.last_name,
      email:     user.email,
      role:      user.role,
    },
    accessToken,
    refreshToken,
  };
};

// ── Refresh Token ─────────────────────────────────────────────────────────────
export const refreshAccessToken = async (token: string) => {
  const payload = verifyRefreshToken(token);

  // Validate against Redis stored token
  const stored = await redis.get(`refresh:${payload.id}`);
  if (!stored || stored !== token) {
    const err: any = new Error("Invalid or expired refresh token");
    err.status = 401;
    throw err;
  }

  const accessToken = generateAccessToken({ id: payload.id, role: payload.role });
  return { accessToken };
};

// ── Logout ────────────────────────────────────────────────────────────────────
export const logoutUser = async (userId: number) => {
  await redis.del(`refresh:${userId}`);
};

// ── Get Current User ──────────────────────────────────────────────────────────
export const getUserById = async (id: number) => {
  const [rows]: any = await db.execute(
    `SELECT id, first_name, last_name, email, role, created_at
     FROM users WHERE id = ?`,
    [id]
  );

  if (rows.length === 0) {
    const err: any = new Error("User not found");
    err.status = 404;
    throw err;
  }

  return {
    id:        rows[0].id,
    firstName: rows[0].first_name,
    lastName:  rows[0].last_name,
    email:     rows[0].email,
    role:      rows[0].role,
    createdAt: rows[0].created_at,
  };
};