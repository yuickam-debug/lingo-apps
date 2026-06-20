import type { SavedWord, AppSettings } from '../types';

// ─── Storage Keys ────────────────────────────────────────────────
// All keys are prefixed by app (de/da) to keep data separate

type Lang = 'de' | 'da';

const KEYS = {
  savedWords: (lang: Lang) => `${lang}:saved-words`,
  settings: (lang: Lang) => `${lang}:settings`,
};

// ─── Default Settings ────────────────────────────────────────────

const DEFAULT_SETTINGS: Record<Lang, AppSettings> = {
  de: {
    theme: 'light',
    ttsVoice: 'de-DE',
    shadowingPauseMs: 1500,
    shadowingSpeed: 1.0,
  },
  da: {
    theme: 'light',
    ttsVoice: 'da-DK',
    shadowingPauseMs: 1500,
    shadowingSpeed: 1.0,
  },
};

// ─── Generic Read/Write ──────────────────────────────────────────

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed:', e);
  }
}

// ─── Saved Words ─────────────────────────────────────────────────

export function loadSavedWords(lang: Lang): Record<string, SavedWord> {
  return read<Record<string, SavedWord>>(KEYS.savedWords(lang)) ?? {};
}

export function saveSavedWords(lang: Lang, words: Record<string, SavedWord>): void {
  write(KEYS.savedWords(lang), words);
}

export function saveWord(lang: Lang, word: SavedWord): void {
  const words = loadSavedWords(lang);
  words[word.word] = word;
  saveSavedWords(lang, words);
}

export function removeWord(lang: Lang, wordKey: string): void {
  const words = loadSavedWords(lang);
  delete words[wordKey];
  saveSavedWords(lang, words);
}

// ─── Settings ────────────────────────────────────────────────────

export function loadSettings(lang: Lang): AppSettings {
  return read<AppSettings>(KEYS.settings(lang)) ?? DEFAULT_SETTINGS[lang];
}

export function saveSettings(lang: Lang, settings: AppSettings): void {
  write(KEYS.settings(lang), settings);
}

// ─── Reset ───────────────────────────────────────────────────────

export function resetAllData(lang: Lang): void {
  localStorage.removeItem(KEYS.savedWords(lang));
  localStorage.removeItem(KEYS.settings(lang));
}

// ─── Generic write utility ───────────────────────────────────────
// Exposes the private write() wrapper for callers (e.g. the hook)
// that need to persist arbitrary keys without touching localStorage directly.

export function storageSet<T>(key: string, value: T): void {
  write(key, value);
}

// ─── Shadowing Streak ─────────────────────────────────────────────

const STREAK_COUNT_KEY = 'shadowing_streak_count';
const STREAK_DATE_KEY  = 'shadowing_streak_last_date';

function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

function yesterdayISO(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
}

export function getShadowingStreak(): number {
  const count    = read<number>(STREAK_COUNT_KEY) ?? 0;
  const lastDate = read<string>(STREAK_DATE_KEY);

  if (!lastDate) return 0;

  const today     = todayISO();
  const yesterday = yesterdayISO();

  if (lastDate === today || lastDate === yesterday) return count;
  return 0; // streak broken
}

export function recordShadowingSession(): void {
  const count    = read<number>(STREAK_COUNT_KEY) ?? 0;
  const lastDate = read<string>(STREAK_DATE_KEY);

  const today     = todayISO();
  const yesterday = yesterdayISO();

  if (lastDate === today) return; // already recorded today

  if (lastDate === yesterday) {
    write(STREAK_COUNT_KEY, count + 1);
    write(STREAK_DATE_KEY, today);
  } else {
    // streak broken or first session ever
    write(STREAK_COUNT_KEY, 1);
    write(STREAK_DATE_KEY, today);
  }
}
