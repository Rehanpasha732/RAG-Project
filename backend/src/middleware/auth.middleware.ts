import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import type { Request, Response, NextFunction } from 'express';
import { getUsersCollection } from '../config/mongo';

export interface AuthRequest extends Request {
    user?: { id: string; email: string };
}

export function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;

    if (!token) {
        return res.status(401).json({ success: false, error: 'No token provided' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string; email: string };
        req.user = payload;
        next();
    } catch {
        return res.status(401).json({ success: false, error: 'Invalid or expired token' });
    }
}

/**
 * Must run after authenticate(). Looks up the authenticated user's current
 * role/disabled state from the database and rejects non-admins. Additive
 * only — does not alter authenticate() or how tokens are issued/verified.
 */
export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        if (!req.user?.id) {
            return res.status(401).json({ success: false, error: 'No token provided' });
        }

        const users = await getUsersCollection();
        const user = await users.findOne({ _id: new ObjectId(req.user.id) });

        if (!user || user.role !== 'admin' || user.disabled) {
            return res.status(403).json({ success: false, error: 'Admin access required' });
        }

        next();
    } catch {
        return res.status(403).json({ success: false, error: 'Admin access required' });
    }
}
