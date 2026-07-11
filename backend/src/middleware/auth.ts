import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/tokens';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: 'STUDENT' | 'ADMIN';
  };
}

/**
 * Standard middleware to verify the access token from cookies
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const token = req.cookies.accessToken;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required. Please log in.' });
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }

  req.user = {
    userId: payload.userId,
    role: payload.role as 'STUDENT' | 'ADMIN',
  };
  
  next();
}

/**
 * Middleware to restrict access to ADMIN only
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
  }
  next();
}
