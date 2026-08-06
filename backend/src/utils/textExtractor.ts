import fs from 'fs';
import path from 'path';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';

export interface ExtractedDocument {
  text: string;
  pages: number;
  metadata: Record<string, unknown>;
}

/**
 * Extract text from various document types
 * @param filePath — Absolute file path
 * @param mimetype — File MIME type
 */
async function extractText(filePath: string, mimetype: string): Promise<ExtractedDocument> {
  switch (mimetype) {

    // ===== PDF =====
    case 'application/pdf': {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      return {
        text: data.text,
        pages: data.numpages,
        metadata: {
          title: data.info?.Title || null,
          author: data.info?.Author || null,
          pageCount: data.numpages
        }
      };
    }

    // ===== DOCX =====
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': {
      const result = await mammoth.extractRawText({ path: filePath });
      return {
        text: result.value,
        pages: estimatePages(result.value),
        metadata: {
          messages: result.messages
        }
      };
    }

    // ===== TXT / CSV / plain text =====
    case 'text/plain':
    case 'text/csv': {
      const text = fs.readFileSync(filePath, 'utf-8');
      return {
        text,
        pages: estimatePages(text),
        metadata: { encoding: 'utf-8' }
      };
    }

    // ===== Excel (.xlsx / .xls) — basic text extraction via mammoth (not ideal)
    // For full Excel support, consider adding 'xlsx' package. For now, try reading raw.
    case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
    case 'application/vnd.ms-excel': {
      // mammoth does not handle Excel; return a note
      return {
        text: `Excel file detected: ${path.basename(filePath)}. Full spreadsheet extraction requires additional processing.`,
        pages: 1,
        metadata: { note: 'Excel extraction is limited to metadata only.' }
      };
    }

    // ===== Images — OCR via Tesseract =====
    case 'image/png':
    case 'image/jpeg':
    case 'image/jpg':
    case 'image/webp':
    case 'image/tiff':
    case 'image/bmp': {
      const Tesseract = await import('tesseract.js');
      const { data } = await Tesseract.recognize(filePath, 'eng');
      return {
        text: data.text,
        pages: 1,
        metadata: {
          confidence: data.confidence,
          language: 'eng'
        }
      };
    }

    // ===== Fallback — try to read as UTF-8 =====
    default:
      try {
        const text = fs.readFileSync(filePath, 'utf-8');
        return { text, pages: estimatePages(text), metadata: {} };
      } catch {
        throw new Error(`Unsupported file type: ${mimetype}`);
      }
  }
}

/**
 * Rough page estimate: ~3000 chars per page
 */
function estimatePages(text: string): number {
  if (!text) return 0;
  return Math.max(1, Math.ceil(text.length / 3000));
}

export { extractText };
