// ─── Content Types ───────────────────────────────────────────────

export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2';
export type Genre = 'narrative' | 'dialogue' | 'news' | 'lyrics';
export type ContentSource = 'story' | 'news' | 'lyrics';

export interface WordDefinition {
  word: string;
  definition: string;
  partOfSpeech: string;    // "noun, m." / "verb" / "adj."
  grammar?: string;        // "der Hauptbahnhof · Haupt + Bahnhof"
}

export interface Sentence {
  id: string;
  text: string;
  translation: string;
  words: WordDefinition[];  // tappable words in this sentence
}

export interface Story {
  id: string;
  title: string;
  level: CEFRLevel;
  genre: Genre;
  source: ContentSource;
  sentences: Sentence[];
  metadata?: {
    publishedDate?: string;  // for news articles
    topic?: string;          // "Politik", "Wirtschaft", etc.
    artist?: string;         // for lyrics
    titleEn?: string;        // English title (from MorningCI format)
    tags?: string[];         // content tags
    grammarPoints?: GrammarPoint[];  // grammar notes (from MorningCI format)
    stanzaBreaks?: number[];         // sentence indices that open a new stanza (lyrics only)
  };
}

// ─── Saved Words ─────────────────────────────────────────────────

export interface ContextAppearance {
  sentenceId: string;
  sentenceText: string;
  storyId: string;
  storyTitle: string;
  source: ContentSource;
}

export interface SavedWord {
  word: string;
  definition: string;
  partOfSpeech: string;
  grammar?: string;
  frequency: number;          // how many times seen across all content
  contexts: ContextAppearance[];
  savedAt: number;            // timestamp
  srsState: SRSState;
}

// ─── SRS (Leitner 3-Box) ────────────────────────────────────────

export type LeitnerBox = 1 | 2 | 3;

export interface SRSState {
  box: LeitnerBox;
  nextReviewDate: string;     // ISO date string
  correctInBox3: number;      // graduate after 2 correct in box 3
  graduated: boolean;
}

export interface ReviewSession {
  wordsReviewed: number;
  wordsCorrect: number;
  wordsIncorrect: number;
  startedAt: number;
}

// ─── App State ───────────────────────────────────────────────────

export interface AppSettings {
  theme: 'light' | 'dark';
  ttsVoice: string;           // e.g. "de-DE" or "da-DK"
  shadowingPauseMs: number;   // default 1500
  shadowingSpeed: 0.7 | 1.0 | 1.2;
}

export interface AppState {
  language: 'de' | 'da';
  savedWords: Record<string, SavedWord>;  // keyed by word
  settings: AppSettings;
  lastReviewSession?: ReviewSession;
}

// ─── Grammar (from MorningCI content format) ─────────────────────

export interface GrammarPoint {
  rule: string;
  exampleSentence: string;
  explanation: string;
}

// ─── News Digest (DELingo only) ──────────────────────────────────

export interface NewsWeek {
  weekOf: string;             // "2026-04-14"
  articles: Story[];          // 5 articles per week
}
