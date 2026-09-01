import jwt from "jsonwebtoken";

const envSecret = process.env.JWT_SECRET;
if (!envSecret) {
  throw new Error("JWT_SECRET no está definido en el entorno");
}
const JWT_SECRET: string = envSecret;

export interface TokenPayload {
  sub: string;
}

export function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
