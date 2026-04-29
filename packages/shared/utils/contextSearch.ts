import type { Story } from '../types';

export interface ContextResult {
  storyTitle: string;
  sentenceText: string;
  sentenceTranslation: string;
}

/**
 * Finds up to 5 sentences across all v2 content that contain an annotated
 * word entry matching lemma (case-insensitive).
 * allContent should be ordered most-recent first (news before stories)
 * so the returned results reflect that ordering.
 */
export function findContextSentences(
  lemma: string,
  allContent: Story[],
  maxResults = 5
): ContextResult[] {
  const lower = lemma.toLowerCase();
  const results: ContextResult[] = [];

  for (const story of allContent) {
    if (results.length >= maxResults) break;
    for (const sentence of story.sentences) {
      if (results.length >= maxResults) break;
      if (sentence.words.some((w) => w.word.toLowerCase() === lower)) {
        results.push({
          storyTitle: story.title,
          sentenceText: sentence.text,
          sentenceTranslation: sentence.translation,
        });
      }
    }
  }

  return results;
}
