import type { SavedWord, SRSState, LeitnerBox } from '../types';

// ─── Leitner Box Intervals ───────────────────────────────────────
// Box 1: review daily
// Box 2: review every 3 days
// Box 3: review every 7 days
// Graduate: after clearing Box 3 twice

const BOX_INTERVALS: Record<LeitnerBox, number> = {
  1: 1,
  2: 3,
  3: 7,
};

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().split('T')[0];
}

function today(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Core SRS Functions ──────────────────────────────────────────

export function createInitialSRSState(): SRSState {
  return {
    box: 1,
    nextReviewDate: today(),
    correctInBox3: 0,
    graduated: false,
  };
}

export function processReview(state: SRSState, correct: boolean): SRSState {
  const now = new Date();

  if (!correct) {
    return {
      box: 1,
      nextReviewDate: addDays(now, BOX_INTERVALS[1]),
      correctInBox3: 0,
      graduated: false,
    };
  }

  if (state.box === 3) {
    const newCorrectCount = state.correctInBox3 + 1;
    if (newCorrectCount >= 2) {
      return {
        ...state,
        correctInBox3: newCorrectCount,
        graduated: true,
        nextReviewDate: '',
      };
    }
    return {
      box: 3,
      nextReviewDate: addDays(now, BOX_INTERVALS[3]),
      correctInBox3: newCorrectCount,
      graduated: false,
    };
  }

  const nextBox = (state.box + 1) as LeitnerBox;
  return {
    box: nextBox,
    nextReviewDate: addDays(now, BOX_INTERVALS[nextBox]),
    correctInBox3: 0,
    graduated: false,
  };
}

// ─── Query Functions ─────────────────────────────────────────────

export function getWordsDueToday(savedWords: Record<string, SavedWord>): SavedWord[] {
  const t = today();
  return Object.values(savedWords).filter(
    (w) => !w.srsState.graduated && w.srsState.nextReviewDate <= t
  );
}

export function getGraduatedCount(savedWords: Record<string, SavedWord>): number {
  return Object.values(savedWords).filter((w) => w.srsState.graduated).length;
}

export function getBoxCounts(savedWords: Record<string, SavedWord>): Record<LeitnerBox, number> {
  const counts: Record<LeitnerBox, number> = { 1: 0, 2: 0, 3: 0 };
  Object.values(savedWords).forEach((w) => {
    if (!w.srsState.graduated) {
      counts[w.srsState.box]++;
    }
  });
  return counts;
}

export function getRetentionRate(savedWords: Record<string, SavedWord>): number {
  const reviewed = Object.values(savedWords).filter(
    (w) => w.srsState.box > 1 || w.srsState.graduated
  );
  if (reviewed.length === 0) return 0;
  const graduated = reviewed.filter((w) => w.srsState.graduated).length;
  const inHighBoxes = reviewed.filter((w) => w.srsState.box >= 2).length;
  return Math.round(((graduated + inHighBoxes) / reviewed.length) * 100);
}

// ─── Cloze Card Generation ───────────────────────────────────────

export interface ClozeCard {
  word: SavedWord;
  sentence: string;
  clozeText: string;
  storyTitle: string;
  source: string;
}

export function generateClozeCard(word: SavedWord): ClozeCard | null {
  if (word.contexts.length === 0) return null;

  const ctx = word.contexts[Math.floor(Math.random() * word.contexts.length)];
  const regex = new RegExp(`(${escapeRegex(word.word)})`, 'gi');
  const clozeText = ctx.sentenceText.replace(regex, '______');

  return {
    word,
    sentence: ctx.sentenceText,
    clozeText,
    storyTitle: ctx.storyTitle,
    source: ctx.source,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
