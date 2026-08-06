import path from 'path';
import fs from 'fs';
import type { Request, Response, NextFunction } from 'express';
import { extractText } from '../utils/textExtractor';
import { chunkText } from '../services/chunk-service';
import { generateEmbedding } from '../services/embedding-service';
import { getEmbeddingsCollection } from '../config/mongo';

/**
 * POST /api/documents/upload
 * Upload a document, extract text, return the result
 */
const uploadDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    const filePath = file.path;
    const mimetype = file.mimetype;

    console.log(`📄 Processing: ${file.originalname} (${mimetype})`);

    // Extract text
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

    const collection = await getEmbeddingsCollection();
    await collection.insertMany(
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

    // --------------------------------
    const result = {
      success: true,
      document: {
        id: path.basename(file.filename, path.extname(file.filename)),
        originalName: file.originalname,
        fileName: file.filename,
        mimetype,
        size: file.size,
        sizeFormatted: formatBytes(file.size),
        uploadedAt: new Date().toISOString()
      },
      extracted: {
        text: extracted.text,
        textLength: extracted.text.length,
        pages: extracted.pages,
        metadata: extracted.metadata
      }
    };

    console.log(`✅ Extracted ${extracted.text.length} chars, ~${extracted.pages} pages`);

    res.json({
      success: true,
      chunksCount: chunks.length,
      chunks: chunksWithEmbeddings
    });

  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/documents/:id
 * Get previously extracted document details
 */
const getDocument = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const uploadDir = path.join(__dirname, '..', '..', 'uploads');

    // Find file starting with this id
    const files = fs.readdirSync(uploadDir)
      .filter(f => f.startsWith(id));

    if (files.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Document not found'
      });
    }

    const filePath = path.join(uploadDir, files[0]);
    const stats = fs.statSync(filePath);

    res.json({
      success: true,
      document: {
        id,
        fileName: files[0],
        size: stats.size,
        sizeFormatted: formatBytes(stats.size),
        uploadedAt: stats.birthtime.toISOString()
      }
    });

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

export { uploadDocument, getDocument };
