import { useState, useEffect, useCallback } from 'react';
import type { SavedWord } from '../types';
import type { ClozeCard } from '../srs/leitner';
import { generateClozeCard, getWordsDueToday, processReview } from '../srs/leitner';
import { loadSavedWords, saveWord, getShadowingStreak } from '../storage';

// ─── Types ───────────────────────────────────────────────────────

type Lang = 'de' | 'da';

interface ReviewCard extends ClozeCard {
  options: string[];  // always populated (overrides optional in ClozeCard)
}

interface SessionEntry {
  word: SavedWord;
  card: ReviewCard;
  lang: Lang;
}

export interface SessionStats {
  correct: number;
  incorrect: number;
}

// ─── Helpers ─────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const LANGS: Lang[] = ['de', 'da'];

function buildSession(): SessionEntry[] {
  const allWords: Record<string, SavedWord> = {};
  const wordLang: Record<string, Lang> = {};

  for (const lang of LANGS) {
    const words = loadSavedWords(lang);
    for (const [key, word] of Object.entries(words)) {
      allWords[key] = word;
      wordLang[key] = lang;
    }
  }

  const due = shuffle(getWordsDueToday(allWords));

  const entries: SessionEntry[] = [];
  for (const word of due) {
    const base = generateClozeCard(word);
    if (!base) continue;  // word has no context sentences — skip

    const others = due.filter((w) => w.word !== word.word);
    const distractors = shuffle(others).slice(0, 2).map((w) => w.word);
    if (distractors.length < 2) distractors.push('...');
    if (distractors.length < 2) distractors.push('---');

    const options = shuffle([word.word, ...distractors]);
    entries.push({ word, card: { ...base, options }, lang: wordLang[word.word] ?? 'de' });
  }

  return entries;
}

// ─── Hook ────────────────────────────────────────────────────────

export function useReviewSession() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<SessionEntry[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<SessionStats>({ correct: 0, incorrect: 0 });
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    setSession(buildSession());
    setStreak(getShadowingStreak());
    setIsLoading(false);
  }, []);

  const totalCards = session.length;
  const isEmpty = !isLoading && totalCards === 0;
  const currentCard: ClozeCard | null =
    !sessionComplete && !isLoading && currentIndex < session.length
      ? session[currentIndex].card
      : null;

  const submitAnswer = useCallback(
    (correct: boolean) => {
      if (sessionComplete || isLoading || currentIndex >= session.length) return;

      const { word, lang } = session[currentIndex];
      const updatedWord: SavedWord = { ...word, srsState: processReview(word.srsState, correct) };
      saveWord(lang, updatedWord);

      setSessionStats((prev) => ({
        correct: prev.correct + (correct ? 1 : 0),
        incorrect: prev.incorrect + (correct ? 0 : 1),
      }));

      const next = currentIndex + 1;
      if (next >= session.length) {
        setSessionComplete(true);
      } else {
        setCurrentIndex(next);
      }
    },
    [session, currentIndex, sessionComplete, isLoading],
  );

  return {
    currentCard,
    currentIndex,
    totalCards,
    sessionComplete,
    isLoading,
    isEmpty,
    streak,
    submitAnswer,
    sessionStats,
  };
}
