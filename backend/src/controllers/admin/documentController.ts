import path from 'path';
import fs from 'fs';
import { ObjectId } from 'mongodb';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { ingestDocument } from '../../services/document-pipeline';
import { getEmbeddingsCollection, getDocumentsCollection, getUsersCollection, COMPANY_SCOPE } from '../../config/mongo';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * POST /api/admin/documents/upload
 * Admin uploads a document for the whole company — every employee's RAG
 * queries can retrieve it, it's not tied to any one user. Reuses the same
 * extractText -> chunkText -> generateEmbedding pipeline as the user-facing
 * upload, untouched — only the owner (COMPANY_SCOPE) and status bookkeeping differ.
 */
const adminUploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const documentsCollection = await getDocumentsCollection();
  let fileId: string | null = null;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.file;
    const filePath = file.path;
    const mimetype = file.mimetype;
    fileId = path.basename(file.filename, path.extname(file.filename));
    const uploadedAt = new Date();

    await documentsCollection.insertOne({
      file_id: fileId,
      user_id: COMPANY_SCOPE,
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

    const { extracted, chunksCount } = await ingestDocument({
      filePath,
      mimetype,
      fileId,
      ownerId: COMPANY_SCOPE,
      originalName: file.originalname
    });

    await documentsCollection.updateOne(
      { file_id: fileId },
      { $set: { pages: extracted.pages, text_length: extracted.text.length, status: 'ready' } }
    );

    res.json({
      success: true,
      document: {
        id: fileId,
        originalName: file.originalname,
        ownerId: COMPANY_SCOPE,
        ownerName: 'Company-wide',
        ownerEmail: 'All employees',
        status: 'ready',
        pages: extracted.pages,
        sizeFormatted: formatBytes(file.size),
        uploadedAt: uploadedAt.toISOString()
      },
      chunksCount
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
    const ownerIds = Array.from(new Set(docs.map(d => d.user_id).filter(id => id !== COMPANY_SCOPE)));
    const owners = await usersCollection
      .find({ _id: { $in: ownerIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter((v): v is ObjectId => v !== null) } })
      .toArray();
    const ownerMap = new Map(owners.map(o => [o._id.toString(), o]));

    res.json({
      success: true,
      documents: docs.map(doc => {
        if (doc.user_id === COMPANY_SCOPE) {
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
            ownerName: 'Company-wide',
            ownerEmail: 'All employees'
          };
        }
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
    if (doc.user_id !== COMPANY_SCOPE) {
      try {
        owner = await usersCollection.findOne({ _id: new ObjectId(doc.user_id) });
      } catch {
        owner = null;
      }
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
        ownerName: doc.user_id === COMPANY_SCOPE ? 'Company-wide' : (owner?.name || 'Unknown'),
        ownerEmail: doc.user_id === COMPANY_SCOPE ? 'All employees' : (owner?.email || 'Unknown')
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
