import jwt from "jsonwebtoken";

export interface JwtPayload {
    id: number;
    role: "admin" | "owner" | "kitchen" | "cashier" | "customer";
}

const getSecret = () => process.env.JWT_SECRET as string;
const getRefreshSecret = () =>
    (process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh") as string;

export const generateAccessToken = (payload: JwtPayload): string =>
    jwt.sign(payload, getSecret(), { expiresIn: "15m" });

export const generateRefreshToken = (payload: JwtPayload): string =>
    jwt.sign(payload, getRefreshSecret(), { expiresIn: "7d" });

export const verifyAccessToken = (token: string): JwtPayload =>
    jwt.verify(token, getSecret()) as JwtPayload;

export const verifyRefreshToken = (token: string): JwtPayload =>
    jwt.verify(token, getRefreshSecret()) as JwtPayload;