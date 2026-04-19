import jwt from 'jsonwebtoken';
import { randomUUID } from 'crypto';
import db from './db';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET ?? 'dev-access-secret-change-in-prod';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET ?? 'dev-refresh-secret-change-in-prod';
const ACCESS_TTL = process.env.NODE_ENV === 'production' ? '15m' : '24h';
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface TokenPayload {
  sub: string;
  email?: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_TTL });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function issueRefreshToken(userId: string): string {
  const token = randomUUID();
  const expiresAt = Date.now() + REFRESH_TTL_MS;
  db.prepare('INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

export function rotateRefreshToken(oldToken: string): { accessToken: string; refreshToken: string; userId: string } | null {
  const row = db.prepare('SELECT * FROM refresh_tokens WHERE token = ?').get(oldToken) as any;
  if (!row || row.expires_at < Date.now()) {
    db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(oldToken);
    return null;
  }
  db.prepare('DELETE FROM refresh_tokens WHERE token = ?').run(oldToken);
  const newRefresh = issueRefreshToken(row.user_id);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as any;
  const accessToken = signAccessToken({ sub: row.user_id, email: user?.email });
  return { accessToken, refreshToken: newRefresh, userId: row.user_id };
}
