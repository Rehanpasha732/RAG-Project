import bcrypt from 'bcryptjs';
import { ObjectId } from 'mongodb';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { getUsersCollection } from '../../config/mongo';

/**
 * PATCH /api/user/settings/password
 * Reused by the admin settings page too — an admin is just a users row
 * with role:'admin', and this only ever acts on req.user.id.
 */
const changePassword = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ success: false, error: 'currentPassword, newPassword and confirmPassword are required' });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, error: 'New password and confirmation do not match' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
    }

    const usersCollection = await getUsersCollection();
    const objectId = new ObjectId(req.user!.id);
    const user = await usersCollection.findOne({ _id: objectId });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, error: 'Current password is incorrect' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await usersCollection.updateOne({ _id: objectId }, { $set: { password: hashedPassword } });

    res.json({ success: true, message: 'Password updated' });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/user/settings/profile
 * Basic profile fields only (name) — email changes are out of scope.
 */
const updateProfile = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ success: false, error: 'name is required' });
    }

    const usersCollection = await getUsersCollection();
    const objectId = new ObjectId(req.user!.id);
    const result = await usersCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { name: name.trim() } },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: { id: result._id.toString(), name: result.name, email: result.email }
    });

  } catch (err) {
    next(err);
  }
};

export { changePassword, updateProfile };
