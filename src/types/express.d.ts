export interface JwtPayload {
  id:   number;
  role: "admin" | "owner" | "kitchen" | "cashier" | "customer";
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}