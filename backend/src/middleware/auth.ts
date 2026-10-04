import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { rateLimit } from 'express-rate-limit';
import { ENV } from '../config/env';
import { dbStore } from '../db/storage';
import { IUser } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 auth requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes.' },
});

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI prompts per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'AI request limit reached. Please wait a moment before sending more coaching queries.' },
});

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required. Please sign in.' });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { id: string; email: string };
    const user = dbStore.getUserById(decoded.id);

    if (!user) {
      res.status(401).json({ error: 'User session invalid or user no longer exists.' });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Session expired. Please sign in again.' });
      return;
    }
    res.status(401).json({ error: 'Invalid authentication token.' });
  }
}
