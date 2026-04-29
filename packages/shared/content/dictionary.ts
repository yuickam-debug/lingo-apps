/**
 * Wiktionary-backed word lookup.
 *
 * Fetches the English Wiktionary definition for a German or Danish word.
 * Results are cached in localStorage for 7 days so repeated lookups are instant.
 *
 * API: https://en.wiktionary.org/api/rest_v1/page/definition/{word}
 * Free, no auth required, supports inflected forms via Wiktionary redirects.
 */

const CACHE_PREFIX = 'lingo_dict_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  definition: string;
  partOfSpeech: string;
  ts: number;
}

function readCache(key: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    if (Date.now() - entry.ts > CACHE_TTL_MS) return null;
    return entry;
  } catch {
    return null;
  }
}

function writeCache(key: string, entry: Omit<CacheEntry, 'ts'>): void {
  try {
    localStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ ...entry, ts: Date.now() }));
  } catch {
    // Storage full — skip
  }
}

function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export interface LookupResult {
  definition: string;
  partOfSpeech: string;
}

/**
 * Look up a word in Wiktionary. Returns empty strings if not found or offline.
 * Results are cached for 7 days.
 */
export async function lookupWord(word: string, lang: 'de' | 'da'): Promise<LookupResult> {
  const cacheKey = `${lang}_${word}`;
  const cached = readCache(cacheKey);
  if (cached) return { definition: cached.definition, partOfSpeech: cached.partOfSpeech };

  const empty: LookupResult = { definition: '', partOfSpeech: '' };

  try {
    const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      writeCache(cacheKey, empty);
      return empty;
    }

    const data = await res.json();

    // Wiktionary groups definitions by language code
    const langKey = lang; // 'de' or 'da'
    const sections: Array<{
      partOfSpeech: string;
      definitions: Array<{ definition: string }>;
    }> = data[langKey] ?? [];

    if (sections.length === 0) {
      writeCache(cacheKey, empty);
      return empty;
    }

    const pos = sections[0].partOfSpeech ?? '';
    const rawDef = sections[0].definitions?.[0]?.definition ?? '';
    const result: LookupResult = {
      definition: stripHtml(rawDef),
      partOfSpeech: pos,
    };

    writeCache(cacheKey, result);
    return result;
  } catch {
    return empty;
  }
}
