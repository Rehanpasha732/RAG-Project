import { ObjectId } from 'mongodb';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { getUsersCollection } from '../../config/mongo';

/**
 * GET /api/admin/users?search=
 * List/search users, excluding password.
 */
const listUsers = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query as { search?: string };

    const filter: Record<string, unknown> = {};
    if (search && search.trim()) {
      filter.$or = [
        { name: { $regex: search.trim(), $options: 'i' } },
        { email: { $regex: search.trim(), $options: 'i' } }
      ];
    }

    const usersCollection = await getUsersCollection();
    const users = await usersCollection
      .find(filter, { projection: { password: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json({
      success: true,
      users: users.map(u => ({
        id: u._id.toString(),
        name: u.name,
        email: u.email,
        role: u.role || 'user',
        disabled: !!u.disabled,
        createdAt: u.created_at
      }))
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/admin/users/:id/status
 * Enable/disable a user.
 */
const toggleUserStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { disabled } = req.body;

    if (typeof disabled !== 'boolean') {
      return res.status(400).json({ success: false, error: 'disabled must be a boolean' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid user id' });
    }

    const usersCollection = await getUsersCollection();
    const result = await usersCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { disabled } },
      { returnDocument: 'after', projection: { password: 0 } }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: result._id.toString(),
        name: result.name,
        email: result.email,
        role: result.role || 'user',
        disabled: !!result.disabled
      }
    });

  } catch (err) {
    next(err);
  }
};

export { listUsers, toggleUserStatus };
