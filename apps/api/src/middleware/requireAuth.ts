import type { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth';

export interface AuthRequest extends Request {
  userId?: string;
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.userId = payload.sub;
    next();
  } catch {
    res.status(401).json({ error: 'invalid or expired token' });
  }
}
