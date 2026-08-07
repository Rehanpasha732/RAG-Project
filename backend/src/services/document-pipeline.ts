import { extractText, type ExtractedDocument } from '../utils/textExtractor';
import { chunkText } from './chunk-service';
import { generateEmbedding } from './embedding-service';
import { getEmbeddingsCollection } from '../config/mongo';

export interface IngestDocumentParams {
  filePath: string;
  mimetype: string;
  fileId: string;
  /** Real userId for a personal upload, or COMPANY_SCOPE for an admin/company-wide upload. */
  ownerId: string;
  originalName: string;
}

export interface IngestDocumentResult {
  extracted: ExtractedDocument;
  chunksCount: number;
}

/**
 * Shared extract -> chunk -> embed -> store step, used by the user upload
 * flow, the admin upload flow, and the re-embed migration script — kept in
 * one place so chunking/embedding changes never need to be made twice.
 * Does not touch the `documents` collection; callers handle that bookkeeping
 * themselves since it differs (admin writes a 'processing' stub first).
 */
export async function ingestDocument(params: IngestDocumentParams): Promise<IngestDocumentResult> {
  const { filePath, mimetype, fileId, ownerId, originalName } = params;

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
      file_id: fileId,
      user_id: ownerId,
      file_name: originalName,
      chunk_index: chunk.id,
      text: chunk.text,
      embedding: chunk.embedding,
      metadata: chunk.metadata,
      created_at: new Date()
    }))
  );

  return { extracted, chunksCount: chunks.length };
}
