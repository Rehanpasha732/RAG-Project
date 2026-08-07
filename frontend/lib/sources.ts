import type { AskSource } from './api';

export function dedupeSources(sources: AskSource[]): AskSource[] {
  const best = new Map<string, AskSource>();
  for (const source of sources) {
    const existing = best.get(source.file_name);
    if (!existing || source.score > existing.score) {
      best.set(source.file_name, source);
    }
  }
  return Array.from(best.values());
}
