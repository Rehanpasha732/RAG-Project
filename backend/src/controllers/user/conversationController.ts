import { ObjectId } from 'mongodb';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { getConversationsCollection } from '../../config/mongo';

function toSummary(doc: { _id?: ObjectId; title: string; created_at: Date; updated_at: Date }) {
  return {
    id: doc._id!.toString(),
    title: doc.title,
    createdAt: doc.created_at,
    updatedAt: doc.updated_at
  };
}

/**
 * POST /api/user/conversations
 * Create a new empty conversation. Kept separate from askQuestion so that
 * controller stays completely untouched.
 */
const createConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const now = new Date();

    const conversationsCollection = await getConversationsCollection();
    const result = await conversationsCollection.insertOne({
      user_id: userId,
      title: 'New chat',
      created_at: now,
      updated_at: now,
      messages: []
    });

    res.status(201).json({
      success: true,
      conversation: { id: result.insertedId.toString(), title: 'New chat', createdAt: now, updatedAt: now }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/user/conversations
 * List the current user's conversations for the sidebar (grouped client-side).
 */
const listConversations = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const conversationsCollection = await getConversationsCollection();

    const conversations = await conversationsCollection
      .find({ user_id: userId })
      .sort({ updated_at: -1 })
      .toArray();

    res.json({
      success: true,
      conversations: conversations.map(toSummary)
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/user/conversations/:id
 * Full message history for a conversation owned by the authenticated user.
 */
const getConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversationsCollection = await getConversationsCollection();
    const conversation = await conversationsCollection.findOne({ _id: objectId, user_id: userId });

    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({
      success: true,
      conversation: {
        ...toSummary(conversation),
        messages: conversation.messages
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/user/conversations/:id/messages
 * Append a user question + assistant answer pair. Called by the frontend
 * right after the existing askQuestion request returns, so that endpoint
 * never has to know about persistence.
 */
const addMessages = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { question, answer, sources } = req.body;

    if (!question || typeof question !== 'string' || !answer || typeof answer !== 'string') {
      return res.status(400).json({ success: false, error: 'question and answer are required' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversationsCollection = await getConversationsCollection();
    const existing = await conversationsCollection.findOne({ _id: objectId, user_id: userId });

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    const now = new Date();
    const newTitle = existing.title === 'New chat'
      ? question.trim().slice(0, 60)
      : existing.title;

    await conversationsCollection.updateOne(
      { _id: objectId, user_id: userId },
      {
        $push: {
          messages: {
            $each: [
              { role: 'user', text: question, created_at: now },
              { role: 'assistant', text: answer, sources: Array.isArray(sources) ? sources : [], created_at: now }
            ]
          }
        },
        $set: { updated_at: now, title: newTitle }
      }
    );

    res.json({
      success: true,
      conversation: { id, title: newTitle, updatedAt: now }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/user/conversations/:id
 * Rename a conversation.
 */
const renameConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const { title } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'title is required' });
    }

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversationsCollection = await getConversationsCollection();
    const result = await conversationsCollection.findOneAndUpdate(
      { _id: objectId, user_id: userId },
      { $set: { title: title.trim() } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, conversation: toSummary(result) });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/user/conversations/:id
 */
const deleteConversation = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    let objectId: ObjectId;
    try {
      objectId = new ObjectId(id);
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid conversation id' });
    }

    const conversationsCollection = await getConversationsCollection();
    const result = await conversationsCollection.deleteOne({ _id: objectId, user_id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted' });

  } catch (err) {
    next(err);
  }
};

export { createConversation, listConversations, getConversation, addMessages, renameConversation, deleteConversation };
