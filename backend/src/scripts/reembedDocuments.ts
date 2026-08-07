import 'dotenv/config';
import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import path from 'path';
import fs from 'fs';
import { getDocumentsCollection, getEmbeddingsCollection } from '../config/mongo';
import { ingestDocument } from '../services/document-pipeline';

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

/**
 * One-off: re-chunks/re-embeds every already-uploaded document (personal
 * and COMPANY_SCOPE) with the current chunk-service settings. Needed after
 * changing chunkSize/chunkOverlap so existing uploads aren't stuck on
 * whatever chunking was in effect when they were first uploaded.
 * Run with `npm run reembed:docs`. Not required for the app to run.
 */
async function reembedDocuments() {
  const documentsCollection = await getDocumentsCollection();
  const embeddingsCollection = await getEmbeddingsCollection();

  const docs = await documentsCollection.find({}).toArray();
  console.log(`Found ${docs.length} documents to re-embed.`);

  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const doc of docs) {
    const filePath = path.join(uploadDir, doc.file_name);
    if (!fs.existsSync(filePath)) {
      console.warn(`SKIP ${doc.original_name} (${doc.file_id}) — file missing on disk: ${filePath}`);
      skipped++;
      continue;
    }

    try {
      await embeddingsCollection.deleteMany({ file_id: doc.file_id });
      const { extracted, chunksCount } = await ingestDocument({
        filePath,
        mimetype: doc.mimetype,
        fileId: doc.file_id,
        ownerId: doc.user_id,
        originalName: doc.original_name
      });
      await documentsCollection.updateOne(
        { file_id: doc.file_id },
        { $set: { pages: extracted.pages, text_length: extracted.text.length } }
      );
      console.log(`OK   ${doc.original_name} (${doc.file_id}) — ${chunksCount} chunks`);
      ok++;
    } catch (err) {
      console.error(`FAIL ${doc.original_name} (${doc.file_id}):`, err);
      failed++;
    }
  }

  console.log(`\nDone. ok=${ok} skipped=${skipped} failed=${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

reembedDocuments().catch(err => {
  console.error('Re-embed run failed:', err);
  process.exit(1);
});
