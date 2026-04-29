import { useState, useEffect, useCallback } from 'react';
import type { WordDefinition } from '../types';
import { lookupWord } from '../content/dictionary';

interface ActiveWord {
  word: WordDefinition;
  sentenceId: string;
}

export function useWordTap(lang: 'de' | 'da') {
  const [activeWord, setActiveWord] = useState<ActiveWord | null>(null);
  const [lookupCache, setLookupCache] = useState<Record<string, { definition: string; partOfSpeech: string }>>({});
  const [lookingUp, setLookingUp] = useState(false);

  useEffect(() => {
    if (!activeWord || activeWord.word.definition) return;
    const word = activeWord.word.word;
    if (lookupCache[word] !== undefined) return;
    setLookingUp(true);
    lookupWord(word, lang).then((result) => {
      setLookupCache((prev) => ({ ...prev, [word]: result }));
      setLookingUp(false);
    });
  }, [activeWord?.word.word, lang]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleWordTap = useCallback(
    (word: WordDefinition, sentenceId: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveWord((prev) =>
        prev?.word.word === word.word && prev.sentenceId === sentenceId
          ? null
          : { word, sentenceId }
      );
    },
    []
  );

  const dismissWord = useCallback(() => setActiveWord(null), []);

  const enrichedActiveWord: WordDefinition | null = activeWord
    ? activeWord.word.definition
      ? activeWord.word
      : {
          ...activeWord.word,
          definition:
            lookupCache[activeWord.word.word]?.definition ??
            (lookingUp ? 'Looking up…' : ''),
          partOfSpeech:
            activeWord.word.partOfSpeech ||
            lookupCache[activeWord.word.word]?.partOfSpeech ||
            '',
        }
    : null;

  return { activeWord, enrichedActiveWord, lookupCache, handleWordTap, dismissWord };
}
