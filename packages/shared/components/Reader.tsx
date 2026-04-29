import { useCallback } from 'react';
import type { Story, WordDefinition, SavedWord } from '../types';
import { SentenceCard } from './SentenceCard';
import { CEFRBadge } from './CEFRBadge';
import { createInitialSRSState } from '../srs/leitner';
import { useWordTap } from '../hooks/useWordTap';
import { useSentenceTranslation } from '../hooks/useSentenceTranslation';

interface ReaderProps {
  story: Story;
  lang: 'de' | 'da';
  savedWords: Record<string, SavedWord>;
  onSaveWord: (word: SavedWord) => void;
  onRemoveWord: (wordKey: string) => void;
}

export function Reader({ story, lang, savedWords, onSaveWord, onRemoveWord }: ReaderProps) {
  const { activeWord, enrichedActiveWord, lookupCache, handleWordTap, dismissWord } = useWordTap(lang);
  const { toggleTranslation, isShown, hideTranslation } = useSentenceTranslation();

  const speak = useCallback(
    (text: string) => {
      window.speechSynthesis.cancel();
      const utt = new SpeechSynthesisUtterance(text);
      utt.lang = lang === 'de' ? 'de-DE' : 'da-DK';
      window.speechSynthesis.speak(utt);
    },
    [lang]
  );

  const handleSentenceTap = useCallback((id: string) => {
    dismissWord();
    toggleTranslation(id);
  }, [dismissWord, toggleTranslation]);

  const handleSaveWord = useCallback(
    (word: WordDefinition, sentence: { id: string; text: string }) => {
      if (savedWords[word.word]) {
        onRemoveWord(word.word);
        return;
      }
      const saved: SavedWord = {
        word: word.word,
        definition: word.definition,
        partOfSpeech: word.partOfSpeech,
        grammar: word.grammar,
        frequency: 1,
        contexts: [
          {
            sentenceId: sentence.id,
            sentenceText: sentence.text,
            storyId: story.id,
            storyTitle: story.title,
            source: story.source,
          },
        ],
        savedAt: Date.now(),
        srsState: createInitialSRSState(),
      };
      onSaveWord(saved);
    },
    [savedWords, story, onSaveWord, onRemoveWord]
  );

  const isLyrics = story.source === 'lyrics';

  return (
    <div className="reader">
      <div className="reader-header">
        <CEFRBadge level={story.level} />
        {story.metadata?.topic && (
          <span className="topic-pill">{story.metadata.topic}</span>
        )}
        {story.metadata?.publishedDate && (
          <span className="topic-pill">{story.metadata.publishedDate}</span>
        )}
        {story.metadata?.artist && (
          <span className="topic-pill">♫ {story.metadata.artist}</span>
        )}
      </div>

      <div className="reader-sentences" role="list">
        {story.sentences.map((sentence) => (
          <SentenceCard
            key={sentence.id}
            sentence={sentence}
            story={story}
            isLyrics={isLyrics}
            isSaved={(w) => !!savedWords[w.word]}
            showTranslation={isShown(sentence.id)}
            activeWord={
              activeWord?.sentenceId === sentence.id ? enrichedActiveWord : null
            }
            onSentenceTap={() => handleSentenceTap(sentence.id)}
            onWordTap={(word, e) => handleWordTap(word, sentence.id, e)}
            onSaveWord={(word) => {
              const enriched = word.definition
                ? word
                : { ...word, definition: lookupCache[word.word]?.definition ?? '' };
              handleSaveWord(enriched, sentence);
            }}
            onSpeak={() => speak(sentence.text)}
          />
        ))}
      </div>
    </div>
  );
}
