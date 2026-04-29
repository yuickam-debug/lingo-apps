/**
 * Fetches the MorningCI content manifest from GitHub, adapts it to the
 * LingoCI Story format, and caches it in localStorage for 1 hour.
 *
 * Mirrors the caching strategy from morningCI's contentService.ts so both
 * apps share the same content source and update cadence.
 */

import type { Story } from '../types';
import { adaptManifest, type MCManifest } from './contentAdapter';
import bundledManifest from './data.json';
import bundledV2 from './data.v2.json';

interface V2Overlay {
  version: string;
  storyTranslations: Record<string, string[]>;
}

function applyTranslationOverlay(story: Story): Story {
  const translations = (bundledV2 as V2Overlay).storyTranslations[story.id];
  if (!translations) return story;
  return {
    ...story,
    sentences: story.sentences.map((s, i) => ({
      ...s,
      translation: translations[i] ?? s.translation,
    })),
  };
}

const CONTENT_URL =
  'https://raw.githubusercontent.com/yuickam-debug/morningci-content/main/content.json';

// Direct Story-format bundles — no adapter needed
const DE_BUNDLE_URL =
  'https://raw.githubusercontent.com/yuickam-debug/lingo-apps/main/packages/delingo/src/content/stories/de-stories-bundle.json';
const DA_BUNDLE_URL =
  'https://raw.githubusercontent.com/yuickam-debug/lingo-apps/main/packages/dalingo/src/content/stories/da-stories-bundle.json';

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

// Bump this string any time translations in data.v2.json change — old caches are dropped automatically
const CACHE_VERSION = 'v2-2026-04-22';

function cacheKey(lang: 'de' | 'da'): string {
  return `lingo_content_${lang}_${CACHE_VERSION}`;
}

function cacheTsKey(lang: 'de' | 'da'): string {
  return `lingo_content_${lang}_${CACHE_VERSION}_ts`;
}

/** Remove any cache entries written by older versions */
function evictStaleCaches(): void {
  const keys = Object.keys(localStorage);
  for (const k of keys) {
    if (k.startsWith('lingo_content_') && !k.includes(CACHE_VERSION)) {
      localStorage.removeItem(k);
    }
  }
}

function readCache(lang: 'de' | 'da'): { stories: Story[]; ts: number } | null {
  try {
    const raw = localStorage.getItem(cacheKey(lang));
    const ts = localStorage.getItem(cacheTsKey(lang));
    if (!raw || !ts) return null;
    return { stories: JSON.parse(raw) as Story[], ts: Number(ts) };
  } catch {
    return null;
  }
}

function writeCache(lang: 'de' | 'da', stories: Story[]): void {
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(stories));
    localStorage.setItem(cacheTsKey(lang), String(Date.now()));
  } catch {
    // Storage full — skip cache
  }
}

/**
 * Load stories for a language.
 *
 * Strategy:
 *  1. If cache is fresh (< 1 h), return cached stories immediately.
 *  2. Otherwise, try to fetch fresh content from GitHub.
 *     - On success: adapt, cache, return.
 *     - On failure (offline): fall back to stale cache or empty array.
 *
 * @param lang      'de' | 'da'
 * @param fallback  Optional array of locally-bundled Story objects to merge in
 *                  when the remote fetch hasn't completed yet (used for instant
 *                  first-load before the network responds).
 */
export async function loadStories(
  lang: 'de' | 'da',
  fallback: Story[] = []
): Promise<Story[]> {
  evictStaleCaches();
  const v1 = adaptManifest(bundledManifest as MCManifest, lang);

  const cached = readCache(lang);
  const fresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;

  let merged: Story[];
  if (fresh) {
    merged = mergeWithFallback(v1, mergeWithFallback(fallback, cached!.stories));
  } else {
    fetchAndCache(lang).catch(() => {/* ignore */});
    merged = mergeWithFallback(v1, fallback);
  }

  // Apply sentence translations after merging so they always win
  return merged.map(applyTranslationOverlay);
}

async function fetchAndCache(lang: 'de' | 'da'): Promise<void> {
  const url = lang === 'de' ? DE_BUNDLE_URL : DA_BUNDLE_URL;
  const res = await fetch(url);
  if (!res.ok) return;
  const bundle: { version: string; stories: Story[] } = await res.json();
  const stories = bundle.stories.map(applyTranslationOverlay);
  writeCache(lang, stories);
}

/** Force a network refresh regardless of cache age. */
export async function refreshStories(lang: 'de' | 'da'): Promise<Story[]> {
  let merged: Story[];
  try {
    const url = lang === 'de' ? DE_BUNDLE_URL : DA_BUNDLE_URL;
    const res = await fetch(url);
    if (res.ok) {
      const remote: Story[] = (await res.json() as { stories: Story[] }).stories;
      writeCache(lang, remote);
      merged = remote;
    } else {
      merged = readCache(lang)?.stories ?? [];
    }
  } catch {
    merged = readCache(lang)?.stories ?? [];
  }
  return merged.map(applyTranslationOverlay);
}

/**
 * Merges remotely-fetched stories with locally-bundled fallback stories.
 * Remote stories win on ID collision (they're more up-to-date).
 * Result is sorted: A1 → A2 → B1, then alphabetically by title.
 */
function mergeWithFallback(remote: Story[], fallback: Story[]): Story[] {
  const map = new Map<string, Story>();
  for (const s of fallback) map.set(s.id, s);
  for (const s of remote) map.set(s.id, s); // remote wins

  const ORDER: Record<string, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };
  return [...map.values()].sort((a, b) => {
    const lvl = (ORDER[a.level] ?? 99) - (ORDER[b.level] ?? 99);
    if (lvl !== 0) return lvl;
    return a.title.localeCompare(b.title);
  });
}
