import path from 'path';
import fs from 'fs';
import type { Response, NextFunction } from 'express';
import type { AuthRequest } from '../../middleware/auth.middleware';
import { generateEmbedding } from '../../services/embedding-service';
import { generateAnswer } from '../../services/llm-service';
import { ingestDocument } from '../../services/document-pipeline';
import { getEmbeddingsCollection, getDocumentsCollection, COMPANY_SCOPE } from '../../config/mongo';

/** Chunks scoring below this on vectorSearchScore are too weakly related to
 * the question to be useful context — passing them to the LLM anyway is
 * what invites it to blend unrelated documents into one answer. */
const MIN_RELEVANCE_SCORE = 0.5;

/** Final number of chunks handed to the LLM when a request doesn't override topK. */
const DEFAULT_FINAL_LIMIT = 15;
/** Max chunks any single document may contribute, so 1-2 strongly-matching
 * files can't crowd out the other documents a multi-document question needs. */
const PER_FILE_CAP = 3;
const CANDIDATE_POOL_MULTIPLIER = 4;
const MIN_CANDIDATE_POOL = 40;
const MAX_CANDIDATE_POOL = 100;
const NUM_CANDIDATES_MULTIPLIER = 15;
/** Atlas $vectorSearch hard cap. */
const MAX_NUM_CANDIDATES = 10000;

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

    const fileId = path.basename(file.filename, path.extname(file.filename));

    const { extracted, chunksCount } = await ingestDocument({
      filePath,
      mimetype,
      fileId,
      ownerId: userId,
      originalName: file.originalname
    });
    console.log(`✅ Extracted ${extracted.text.length} chars, generated ${chunksCount} chunks`);
    console.log(`💾 Stored ${chunksCount} embeddings in MongoDB Atlas`);

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
      chunksCount,
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

/**
 * POST /api/documents/query-embedding
 * Take a user's question and embed it using the same Ollama model
 * used for document chunks. First step of retrieval — no search yet.
 */
const embedQuery = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }

    const embedding = await generateEmbedding(query.trim());

    res.json({
      success: true,
      query: query.trim(),
      dimensions: embedding.length,
      embedding
    });

  } catch (err) {
    next(err);
  }
};

interface RetrievedChunk {
  file_id: string;
  file_name: string;
  chunk_index: number;
  text: string;
  score: number;
}

/**
 * Keeps each file's best `perFileCap` chunks so a question spanning several
 * documents isn't starved by 1-2 documents that happen to score highest
 * overall. $vectorSearch already returns results sorted by score desc, so a
 * single pass gives each file_id its own top-N without a per-group sort;
 * the merged set is re-sorted once at the end before the final slice.
 */
function diversifyByFile<T extends { file_id: string; score: number }>(
  results: T[],
  perFileCap: number,
  overallCap: number
): T[] {
  const perFile = new Map<string, T[]>();
  for (const r of results) {
    const bucket = perFile.get(r.file_id) ?? [];
    if (bucket.length < perFileCap) {
      bucket.push(r);
      perFile.set(r.file_id, bucket);
    }
  }

  return Array.from(perFile.values())
    .flat()
    .sort((a, b) => b.score - a.score)
    .slice(0, overallCap);
}

/**
 * Shared retrieval step: embed the query, then run MongoDB Atlas Vector
 * Search against stored chunk embeddings. Matches the user's own uploads
 * plus every COMPANY_SCOPE document (admin uploads shared with all
 * employees) — both live on the same `user_id` field, so this is a single
 * indexed $in filter rather than an app-side merge of two queries.
 *
 * Casts a wider net than `finalLimit` (the candidate pool) so that chunks
 * from multiple relevant documents survive into consideration, then
 * diversifies by file before applying the final limit — otherwise a global
 * top-N would let 1-2 strongly-matching documents crowd out the rest of a
 * multi-document question. Results below MIN_RELEVANCE_SCORE are dropped so
 * weakly-related chunks (e.g. a different file that merely shares
 * vocabulary) don't get blended into the answer.
 */
async function retrieveChunks(query: string, userId: string, finalLimit: number) {
  const queryEmbedding = await generateEmbedding(query);
  const embeddingsCollection = await getEmbeddingsCollection();

  const candidatePoolLimit = Math.min(
    Math.max(finalLimit * CANDIDATE_POOL_MULTIPLIER, MIN_CANDIDATE_POOL),
    MAX_CANDIDATE_POOL
  );
  const numCandidates = Math.min(candidatePoolLimit * NUM_CANDIDATES_MULTIPLIER, MAX_NUM_CANDIDATES);

  const results = await embeddingsCollection.aggregate<RetrievedChunk>([
    {
      $vectorSearch: {
        index: 'vector_index',
        path: 'embedding',
        queryVector: queryEmbedding,
        filter: { user_id: { $in: [userId, COMPANY_SCOPE] } },
        numCandidates,
        limit: candidatePoolLimit
      }
    },
    {
      $project: {
        _id: 0,
        file_id: 1,
        file_name: 1,
        chunk_index: 1,
        text: 1,
        score: { $meta: 'vectorSearchScore' }
      }
    }
  ]).toArray();

  const relevant = results.filter(r => r.score >= MIN_RELEVANCE_SCORE);
  return diversifyByFile(relevant, PER_FILE_CAP, finalLimit);
}

/**
 * POST /api/documents/ask
 * Full RAG: retrieve relevant chunks via the retrieveChunks helper,
 * then ask the LLM to answer using only those chunks as context.
 */
const askQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { query, topK } = req.body;
    const userId = req.user!.id;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }

    const limit = Number.isInteger(topK) && topK > 0 ? topK : DEFAULT_FINAL_LIMIT;
    const matches = await retrieveChunks(query.trim(), userId, limit);

    if (matches.length === 0) {
      return res.json({
        success: true,
        query: query.trim(),
        answer: "I don't have any documents to answer this from yet. Upload something first.",
        sources: []
      });
    }

    const { answer, usedIndices } = await generateAnswer(
      query.trim(),
      matches.map(m => ({ text: m.text as string, file_name: m.file_name as string }))
    );

    // Only surface the chunks the model actually cited via SOURCES_USED. If it
    // didn't produce a valid citation line, fall back to the single best match
    // rather than dumping every retrieved file as a "source".
    const citedMatches = usedIndices.length > 0
      ? usedIndices.map(i => matches[i - 1]).filter((m): m is typeof matches[number] => Boolean(m))
      : matches.slice(0, 1);

    const seenFiles = new Set<string>();
    const sources = citedMatches
      .filter(m => {
        if (seenFiles.has(m.file_name as string)) return false;
        seenFiles.add(m.file_name as string);
        return true;
      })
      .map(m => ({ file_name: m.file_name, score: m.score }));

    res.json({
      success: true,
      query: query.trim(),
      answer,
      sources
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

export { uploadDocument, listDocuments, getDocument, updateDocument, deleteDocument, embedQuery, askQuestion };
