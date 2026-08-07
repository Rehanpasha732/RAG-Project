import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { getUsersCollection, getDocumentsCollection, getConversationsCollection } from '../../config/mongo';

/**
 * GET /api/admin/dashboard/stats
 * Basic counts for the admin dashboard.
 */
const getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const [usersCollection, documentsCollection, conversationsCollection] = await Promise.all([
      getUsersCollection(),
      getDocumentsCollection(),
      getConversationsCollection()
    ]);

    const [totalUsers, totalDocuments, totalConversations] = await Promise.all([
      usersCollection.countDocuments(),
      documentsCollection.countDocuments(),
      conversationsCollection.countDocuments()
    ]);

    res.json({
      success: true,
      stats: { totalUsers, totalDocuments, totalConversations }
    });

  } catch (err) {
    next(err);
  }
};

export { getStats };
