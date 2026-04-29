import type { Story } from '../types';

/**
 * Counts how many annotated word entries across all v2 content
 * case-insensitively match the given lemma.
 * Only searches sentences[].words[].word — never raw body text.
 */
export function countWordFrequency(lemma: string, allContent: Story[]): number {
  const lower = lemma.toLowerCase();
  let count = 0;
  for (const story of allContent) {
    for (const sentence of story.sentences) {
      for (const w of sentence.words) {
        if (w.word.toLowerCase() === lower) count++;
      }
    }
  }
  return count;
}
