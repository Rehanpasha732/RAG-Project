import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getUsersCollection } from '../../config/mongo';

function signToken(id: string, email: string) {
    return jwt.sign(
        { id, email },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
    );
}

const adminLogin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, error: 'email and password are required' });
        }

        const users = await getUsersCollection();
        const user = await users.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        if (user.role !== 'admin') {
            return res.status(403).json({ success: false, error: 'This account does not have admin access' });
        }

        if (user.disabled) {
            return res.status(403).json({ success: false, error: 'This account has been disabled' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = signToken(user._id.toString(), user.email);

        res.json({
            success: true,
            token,
            user: { id: user._id.toString(), name: user.name, email: user.email, role: user.role }
        });

    } catch (err) {
        next(err);
    }
};

export { adminLogin };
