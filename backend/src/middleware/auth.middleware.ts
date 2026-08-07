import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';

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
