import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { getUsersCollection } from '../config/mongo';

function signToken(id: string, email: string) {
    return jwt.sign(
        { id, email },
        process.env.JWT_SECRET as string,
        { expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'] }
    );
}

const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, error: 'name, email and password are required' });
        }
        if (password.length < 6) {
            return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
        }

        const users = await getUsersCollection();
        const existing = await users.findOne({ email: email.toLowerCase() });
        if (existing) {
            return res.status(409).json({ success: false, error: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await users.insertOne({
            name,
            email: email.toLowerCase(),
            password: hashedPassword,
            created_at: new Date()
        });

        const token = signToken(result.insertedId.toString(), email.toLowerCase());

        res.status(201).json({
            success: true,
            token,
            user: { id: result.insertedId.toString(), name, email: email.toLowerCase() }
        });

    } catch (err) {
        next(err);
    }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
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

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, error: 'Invalid email or password' });
        }

        const token = signToken(user._id.toString(), user.email);

        res.json({
            success: true,
            token,
            user: { id: user._id.toString(), name: user.name, email: user.email }
        });

    } catch (err) {
        next(err);
    }
};

export { signup, login };
