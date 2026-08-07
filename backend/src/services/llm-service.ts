import ollama from 'ollama';
import { DOC_AI_SYSTEM_PROMPT } from '../prompts/docAI';

interface ContextChunk {
  text: string;
  file_name: string;
}

export async function generateAnswer(question: string, chunks: ContextChunk[]): Promise<string> {
  const context = chunks
    .map((chunk, i) => `[${i + 1}] (from ${chunk.file_name})\n${chunk.text}`)
    .join('\n\n');

  const systemPrompt = DOC_AI_SYSTEM_PROMPT;

  const response = await ollama.chat({
    model: 'llama3.2:3b',
    messages: [
      {
        role: 'system',
        content: systemPrompt
      },
      {
        role: 'user',
        content: `Context:\n${context}\n\nQuestion: ${question}`
      }
    ]
  });

  return response.message.content;
}
