import path from 'path';
import fs from 'fs';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../middleware/auth.middleware';
import { extractText } from '../utils/textExtractor';
import { chunkText } from '../services/chunk-service';
import { generateEmbedding } from '../services/embedding-service';
import { getEmbeddingsCollection, getDocumentsCollection } from '../config/mongo';

/**
 * POST /api/documents/upload
 * Upload a document, extract text, generate + store embeddings
 */
const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const userId = req.user!.id;
    const file = req.file;
    const filePath = file.path;
    const mimetype = file.mimetype;

    console.log(`📄 Processing: ${file.originalname} (${mimetype})`);

    const extracted = await extractText(filePath, mimetype);
    const chunks = await chunkText(extracted.text);
    console.log(`✅ Extracted ${extracted.text.length} chars, generated ${chunks.length} chunks`);
    console.log(`🔄 Generating embeddings using Ollama...`);
    const chunksWithEmbeddings = [];
    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.text);
      chunksWithEmbeddings.push({
        ...chunk,
        embedding
      });
    }

    const fileId = path.basename(file.filename, path.extname(file.filename));

    const embeddingsCollection = await getEmbeddingsCollection();
    await embeddingsCollection.insertMany(
      chunksWithEmbeddings.map(chunk => ({
        file_id: fileId,
        file_name: file.originalname,
        chunk_index: chunk.id,
        text: chunk.text,
        embedding: chunk.embedding,
        metadata: chunk.metadata,
        created_at: new Date()
      }))
    );
    console.log(`💾 Stored ${chunksWithEmbeddings.length} embeddings in MongoDB Atlas`);

    const sizeFormatted = formatBytes(file.size);
    const uploadedAt = new Date();

    const documentsCollection = await getDocumentsCollection();
    await documentsCollection.insertOne({
      file_id: fileId,
      user_id: userId,
      original_name: file.originalname,
      file_name: file.filename,
      mimetype,
      size: file.size,
      size_formatted: sizeFormatted,
      pages: extracted.pages,
      text_length: extracted.text.length,
      uploaded_at: uploadedAt
    });

    res.json({
      success: true,
      document: {
        id: fileId,
        originalName: file.originalname,
        fileName: file.filename,
        mimetype,
        size: file.size,
        sizeFormatted,
        pages: extracted.pages,
        uploadedAt: uploadedAt.toISOString()
      },
      chunksCount: chunks.length,
      extracted: {
        textLength: extracted.text.length,
        pages: extracted.pages,
        metadata: extracted.metadata
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents
 * List all documents belonging to the authenticated user
 */
const listDocuments = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const documentsCollection = await getDocumentsCollection();

    const docs = await documentsCollection
      .find({ user_id: userId })
      .sort({ uploaded_at: -1 })
      .toArray();

    res.json({
      success: true,
      documents: docs.map(doc => ({
        id: doc.file_id,
        originalName: doc.original_name,
        fileName: doc.file_name,
        mimetype: doc.mimetype,
        size: doc.size,
        sizeFormatted: doc.size_formatted,
        pages: doc.pages,
        textLength: doc.text_length,
        uploadedAt: doc.uploaded_at
      }))
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id
 * Get a single document's details (must belong to the authenticated user)
 */
const getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;
    const documentsCollection = await getDocumentsCollection();

    const doc = await documentsCollection.findOne({ file_id: id, user_id: userId });

    if (!doc) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
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
        uploadedAt: doc.uploaded_at
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * PATCH /api/documents/:id
 * Rename a document (must belong to the authenticated user)
 */
const updateDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { originalName } = req.body;
    const userId = req.user!.id;

    if (!originalName || typeof originalName !== 'string') {
      return res.status(400).json({ success: false, error: 'originalName is required' });
    }

    const documentsCollection = await getDocumentsCollection();
    const result = await documentsCollection.findOneAndUpdate(
      { file_id: id, user_id: userId },
      { $set: { original_name: originalName } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    res.json({
      success: true,
      document: {
        id: result.file_id,
        originalName: result.original_name
      }
    });

  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/documents/:id
 * Delete a document, its embeddings, and its file (must belong to the authenticated user)
 */
const deleteDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const documentsCollection = await getDocumentsCollection();
    const doc = await documentsCollection.findOne({ file_id: id, user_id: userId });

    if (!doc) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const embeddingsCollection = await getEmbeddingsCollection();
    await embeddingsCollection.deleteMany({ file_id: id });
    await documentsCollection.deleteOne({ file_id: id, user_id: userId });

    const uploadDir = path.join(__dirname, '..', '..', 'uploads');
    const filePath = path.join(uploadDir, doc.file_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ success: true, message: 'Document deleted' });

  } catch (err) {
    next(err);
  }
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export { uploadDocument, listDocuments, getDocument, updateDocument, deleteDocument };
