import { useCallback, useEffect, useRef, useState } from 'react';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { loadSettings, storageSet, recordShadowingSession } from '../storage';

type Lang = 'de' | 'da';

interface ShadowingSettings {
  speed: 0.7 | 1.0 | 1.2;
  pauseMs: number;
}

export function useShadowingPlayer(
  sentences: string[],
  storyId: string,
  lang: Lang,
): {
  play: () => void;
  pause: () => void;
  stop: () => void;
  loopSentence: (index: number, times: number) => void;
  currentIndex: number;
  isPlaying: boolean;
  loopCountdown: number | null;
} {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loopCountdown, setLoopCountdown] = useState<number | null>(null);

  const isPausedRef   = useRef(false);
  const isPlayingRef  = useRef(false);
  const indexRef      = useRef(0);
  const timerRef      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsRef   = useRef<ShadowingSettings>({ speed: 1.0, pauseMs: 1500 });
  const loopActiveRef = useRef(false);

  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;

  const ttsLang = lang === 'de' ? 'de-DE' : 'da-DK';

  useEffect(() => {
    const s = loadSettings(lang);
    settingsRef.current = { speed: s.shadowingSpeed, pauseMs: s.shadowingPauseMs };
  }, [lang]);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const ttsStop = () => TextToSpeech.stop().catch(() => {});

  // ── Main-sequence speak ───────────────────────────────────────────────────
  // Mutable ref so it can call itself recursively after the pause gap
  // without stale-closure issues.

  const speakRef = useRef<(idx: number) => Promise<void>>(null!);
  speakRef.current = async (idx: number): Promise<void> => {
    const all = sentencesRef.current;

    if (idx >= all.length) {
      recordCompletion();
      return;
    }

    const { speed, pauseMs } = settingsRef.current;
    const text = all[idx];

    try {
      await TextToSpeech.speak({ text, lang: ttsLang, rate: speed, pitch: 1.0, volume: 1.0 });
    } catch {
      return; // cancelled by pause / stop, or TTS engine error
    }

    if (isPausedRef.current) return;

    const next = idx + 1;

    if (next >= sentencesRef.current.length) {
      recordCompletion();
      return;
    }

    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (!isPausedRef.current) {
        indexRef.current = next;
        setCurrentIndex(next);
        speakRef.current(next);
      }
    }, pauseMs);
  };

  // ── Loop speak ────────────────────────────────────────────────────────────

  const speakLoopRef = useRef<(idx: number, remaining: number) => Promise<void>>(null!);
  speakLoopRef.current = async (idx: number, remaining: number): Promise<void> => {
    if (!loopActiveRef.current) return;

    const text = sentencesRef.current[idx] ?? '';
    if (!text) return;

    const { speed, pauseMs } = settingsRef.current;

    try {
      await TextToSpeech.speak({ text, lang: ttsLang, rate: speed, pitch: 1.0, volume: 1.0 });
    } catch {
      return;
    }

    if (!loopActiveRef.current) return;

    const next = remaining - 1;

    if (next <= 0) {
      // All repetitions done — clear countdown and resume main sequence.
      setLoopCountdown(null);
      loopActiveRef.current = false;
      isPausedRef.current   = false;
      isPlayingRef.current  = true;
      const resumeIdx       = idx + 1;
      indexRef.current      = resumeIdx;
      setCurrentIndex(resumeIdx);
      setIsPlaying(true);
      speakRef.current(resumeIdx);
      return;
    }

    setLoopCountdown(next);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (loopActiveRef.current) {
        speakLoopRef.current(idx, next);
      }
    }, pauseMs);
  };

  // ── Session completion ────────────────────────────────────────────────────

  // Not a useCallback — reassigned each render so storyId closure is always fresh.
  const recordCompletion = () => {
    const today = new Date().toISOString().split('T')[0];
    storageSet(`shadowing_last_completed_${storyId}`, today);
    recordShadowingSession();

    ttsStop();
    clearTimer();
    loopActiveRef.current = false;
    isPausedRef.current   = false;
    isPlayingRef.current  = false;
    indexRef.current      = 0;
    setCurrentIndex(0);
    setIsPlaying(false);
    setLoopCountdown(null);
  };

  // ── Public API ────────────────────────────────────────────────────────────

  const play = useCallback(() => {
    if (isPlayingRef.current && !isPausedRef.current) return;
    isPausedRef.current  = false;
    isPlayingRef.current = true;
    setIsPlaying(true);
    speakRef.current(indexRef.current);
  }, []);

  const pause = useCallback(() => {
    isPausedRef.current  = true;
    isPlayingRef.current = false;
    setIsPlaying(false);
    ttsStop();
  }, []);

  const stop = useCallback(() => {
    ttsStop();
    clearTimer();
    loopActiveRef.current = false;
    isPausedRef.current   = false;
    isPlayingRef.current  = false;
    indexRef.current      = 0;
    setCurrentIndex(0);
    setIsPlaying(false);
    setLoopCountdown(null);
  }, [clearTimer]);

  const loopSentence = useCallback((index: number, times: number) => {
    if (times <= 0) return;
    isPausedRef.current  = true;
    clearTimer();
    ttsStop();
    loopActiveRef.current = true;
    setLoopCountdown(times);
    speakLoopRef.current(index, times);
  }, [clearTimer]);

  useEffect(() => {
    return () => {
      ttsStop();
      clearTimer();
    };
  }, [clearTimer]);

  return { play, pause, stop, loopSentence, currentIndex, isPlaying, loopCountdown };
}
