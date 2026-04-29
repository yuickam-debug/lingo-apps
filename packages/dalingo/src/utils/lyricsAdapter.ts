import type { Sentence } from '@lingo/shared/types';

export interface Stanza {
  lines: Sentence[];
  isChorus: boolean;
}

/**
 * Groups a flat list of lyric lines into stanzas.
 *
 * A new stanza begins when a line has been seen before (chorus detection).
 * The first occurrence of a repeated line is the chorus start.
 */
export function groupIntoStanzas(sentences: Sentence[], stanzaBreaks?: number[]): Stanza[] {
  const breakSet = stanzaBreaks && stanzaBreaks.length > 0
    ? new Set(stanzaBreaks)
    : null;

  const seenTexts = new Set<string>();
  const breakBefore: Set<number> = breakSet ?? new Set<number>();

  if (!breakSet) {
    for (let i = 0; i < sentences.length; i++) {
      const text = sentences[i].text.trim().toLowerCase();
      if (i > 0 && seenTexts.has(text)) breakBefore.add(i);
      seenTexts.add(text);
    }
  }

  // Find which line index first introduced each text (for chorus detection)
  const firstSeen = new Map<string, number>();
  for (let i = 0; i < sentences.length; i++) {
    const text = sentences[i].text.trim().toLowerCase();
    if (!firstSeen.has(text)) firstSeen.set(text, i);
  }

  // Build stanzas
  const stanzas: Stanza[] = [];
  let currentLines: Sentence[] = [];

  for (let i = 0; i < sentences.length; i++) {
    if (i > 0 && breakBefore.has(i)) {
      if (currentLines.length > 0) {
        stanzas.push({ lines: currentLines, isChorus: false });
      }
      currentLines = [];
    }
    currentLines.push(sentences[i]);
  }

  if (currentLines.length > 0) {
    stanzas.push({ lines: currentLines, isChorus: false });
  }

  // Mark stanzas that contain a repeated line as chorus
  return stanzas.map((stanza) => {
    const isChorus = stanza.lines.some((line) => {
      const text = line.text.trim().toLowerCase();
      return firstSeen.get(text) !== sentences.indexOf(line);
    });
    return { ...stanza, isChorus };
  });
}
