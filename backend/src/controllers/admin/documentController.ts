import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { extractText } from '../../utils/textExtractor';
import { chunkText } from '../../services/chunk-service';
import { generateEmbedding } from '../../services/embedding-service';
import { getEmbeddingsCollection, getDocumentsCollection, getUsersCollection } from '../../config/mongo';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * POST /api/admin/documents/upload
 * Admin uploads a document on behalf of a specific user. Reuses the same
 * extractText -> chunkText -> generateEmbedding pipeline as the user-facing
 * upload, untouched — only the owner and status bookkeeping differ.
 */
const adminUploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const documentsCollection = await getDocumentsCollection();
  let fileId: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const { targetUserId } = req.body;
    if (!targetUserId || typeof targetUserId !== 'string') {
      return res.status(400).json({ success: false, error: 'targetUserId is required' });
    }

    const usersCollection = await getUsersCollection();
    let targetUser;
    try {
      targetUser = await usersCollection.findOne({ _id: new ObjectId(targetUserId) });
    } catch {
      return res.status(400).json({ success: false, error: 'Invalid targetUserId' });
    }
    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'Target user not found' });
    }

    const file = req.file;
    const filePath = file.path;
    const mimetype = file.mimetype;
    fileId = path.basename(file.filename, path.extname(file.filename));
    const uploadedAt = new Date();

    await documentsCollection.insertOne({
      file_id: fileId,
      user_id: targetUserId,
      original_name: file.originalname,
      file_name: file.filename,
      mimetype,
      size: file.size,
      size_formatted: formatBytes(file.size),
      pages: 0,
      text_length: 0,
      uploaded_at: uploadedAt,
      status: 'processing'
    });

    const extracted = await extractText(filePath, mimetype);
    const chunks = await chunkText(extracted.text);
    const chunksWithEmbeddings = [];
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      chunksWithEmbeddings.push({ ...chunk, embedding });
    }

    const embeddingsCollection = await getEmbeddingsCollection();
    await embeddingsCollection.insertMany(
      chunksWithEmbeddings.map(chunk => ({
        file_id: fileId as string,
        user_id: targetUserId,
        file_name: file.originalname,
        chunk_index: chunk.id,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
        created_at: new Date()
      }))
    );

    await documentsCollection.updateOne(
      { file_id: fileId },
      { $set: { pages: extracted.pages, text_length: extracted.text.length, status: 'ready' } }
    );

    res.json({
      success: true,
      document: {
        id: fileId,
        originalName: file.originalname,
        ownerId: targetUserId,
        ownerName: targetUser.name,
        ownerEmail: targetUser.email,
        status: 'ready',
        pages: extracted.pages,
        sizeFormatted: formatBytes(file.size),
        uploadedAt: uploadedAt.toISOString()
      },
      chunksCount: chunks.length
    });

  } catch (err) {
    if (fileId) {
      const message = err instanceof Error ? err.message : 'Processing failed';
      await documentsCollection.updateOne(
        { file_id: fileId },
        { $set: { status: 'failed', error: message } }
      ).catch(() => {});
    }
    next(err);
  }
};

/**
 * GET /api/admin/documents
 * List documents across all users, optionally filtered by userId/status/q.
 */
const adminListDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { userId, status, q } = req.query as { userId?: string; status?: string; q?: string };

    const filter: Record<string, unknown> = {};
    if (userId) filter.user_id = userId;
    if (status) filter.status = status;
    if (q) filter.original_name = { $regex: q, $options: 'i' };

    const documentsCollection = await getDocumentsCollection();
    const docs = await documentsCollection.find(filter).sort({ uploaded_at: -1 }).toArray();

    const usersCollection = await getUsersCollection();
    const ownerIds = Array.from(new Set(docs.map(d => d.user_id)));
    const owners = await usersCollection
      .find({ _id: { $in: ownerIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter((v): v is ObjectId => v !== null) } })
      .toArray();
    const ownerMap = new Map(owners.map(o => [o._id.toString(), o]));

    res.json({
      success: true,
      documents: docs.map(doc => {
        const owner = ownerMap.get(doc.user_id);
        return {
          id: doc.file_id,
          originalName: doc.original_name,
          mimetype: doc.mimetype,
          size: doc.size,
          sizeFormatted: doc.size_formatted,
          pages: doc.pages,
          textLength: doc.text_length,
          uploadedAt: doc.uploaded_at,
          status: doc.status || 'ready',
          error: doc.error || null,
          ownerId: doc.user_id,
          ownerName: owner?.name || 'Unknown',
          ownerEmail: owner?.email || 'Unknown'
        };
      })
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/admin/documents/:id
 * Per-file detail, admin-scoped (no user_id filter).
 */
const adminGetDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const documentsCollection = await getDocumentsCollection();
    const doc = await documentsCollection.findOne({ file_id: id });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const usersCollection = await getUsersCollection();
    let owner = null;
    try {
      owner = await usersCollection.findOne({ _id: new ObjectId(doc.user_id) });
    } catch {
      owner = null;
    }

    res.json({
      success: true,
      document: {
        id: doc.file_id,
        originalName: doc.original_name,
        fileName: doc.file_name,
        mimetype: doc.mimetype,
        size: doc.size,
        sizeFormatted: doc.size_formatted,
        pages: doc.pages,
        textLength: doc.text_length,
        uploadedAt: doc.uploaded_at,
        status: doc.status || 'ready',
        error: doc.error || null,
        ownerId: doc.user_id,
        ownerName: owner?.name || 'Unknown',
        ownerEmail: owner?.email || 'Unknown'
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/admin/documents/:id
 * Same delete-embeddings-then-doc-then-file pattern as the user-facing
 * deleteDocument, admin-scoped instead of user_id-filtered.
 */
const adminDeleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const documentsCollection = await getDocumentsCollection();
    const doc = await documentsCollection.findOne({ file_id: id });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const embeddingsCollection = await getEmbeddingsCollection();
    await embeddingsCollection.deleteMany({ file_id: id });
    await documentsCollection.deleteOne({ file_id: id });

    const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads');
    const filePath = path.join(uploadDir, doc.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Document deleted' });

  } catch (err) {
    next(err);
  }
};

export { adminUploadDocument, adminListDocuments, adminGetDocument, adminDeleteDocument };
