import ollama from 'ollama';
import { DOC_AI_SYSTEM_PROMPT } from '../prompt/docsAi';

interface ContextChunk {
  text: string;
  file_name: string;
}

/**
 * Roman Urdu/Hindi marker words. The system prompt already says "match the
 * user's language", but that rule sits inside one long paragraph and small
 * local models (llama3.2:3b) drift past it — especially once earlier turns
 * were in Roman Urdu. Restating the language as an explicit directive right
 * next to the question, on every call, is far more reliable than relying on
 * the system prompt alone.
 */
const ROMAN_URDU_MARKERS = [
  'hai', 'hain', 'kya', 'kyun', 'kyu', 'kaise', 'kaisay', 'mein', 'ke', 'ka', 'ki',
  'nahi', 'nahin', 'aap', 'tum', 'kar', 'raha', 'rahi', 'rha', 'rhi', 'wala',
  'karo', 'krna', 'karna', 'bhi', 'hoga', 'hogi', 'sakta', 'sakte',
  'chahiye', 'mera', 'meri', 'mujhe', 'humein', 'apka', 'apki', 'kro'
];

function detectLanguageDirective(question: string): string {
  const words = question.toLowerCase().match(/[a-z]+/g) || [];
  const isRomanUrdu = words.some(w => ROMAN_URDU_MARKERS.includes(w));
  return isRomanUrdu
    ? 'The question above is written in Roman Urdu. Respond only in Roman Urdu.'
    : 'The question above is written in English. Respond only in English — do not switch to Roman Urdu or any other language.';
}

/** Ollama's default context window is small; with up to ~15 chunks now
 * retrieved per question, the prompt needs enough room to avoid silent
 * truncation. Overridable via env for memory-constrained machines. */
const NUM_CTX = parseInt(process.env.OLLAMA_NUM_CTX || '8192', 10);

export interface GeneratedAnswer {
  answer: string;
  /** 1-based indices into the `chunks` array passed to generateAnswer, per the model's own SOURCES_USED line. */
  usedIndices: number[];
}

const SOURCES_LINE_RE = /\n?SOURCES_USED:\s*\[([^\]]*)\]\s*$/i;

/** Splits the model's SOURCES_USED footer (see docsAi.ts OUTPUT CONTRACT) off the answer text. */
function extractUsedIndices(raw: string): GeneratedAnswer {
  const match = raw.match(SOURCES_LINE_RE);
  if (!match) {
    return { answer: raw.trim(), usedIndices: [] };
  }

  const usedIndices = match[1]
    .split(',')
    .map(s => parseInt(s.trim(), 10))
    .filter(n => Number.isInteger(n) && n > 0);

  return { answer: raw.slice(0, match.index).trim(), usedIndices };
}

export async function generateAnswer(question: string, chunks: ContextChunk[]): Promise<GeneratedAnswer> {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] (from ${chunk.file_name})\n${chunk.text}`)
    .join('\n\n');

  const response = await ollama.chat({
    model: process.env.model || 'llama3.2:3b',
    messages: [
      {
        role: 'system',
        content: DOC_AI_SYSTEM_PROMPT
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}\n\n${detectLanguageDirective(question)}\n\nEnd your reply with the SOURCES_USED: [...] line as required by your system instructions — list only the source numbers you actually relied on.`
      }
    ],
    options: { num_ctx: NUM_CTX }
  });

  return extractUsedIndices(response.message.content);
}
