import type { Story, SavedWord, WordDefinition } from '@lingo/shared/types';
import { SentenceCard } from '@lingo/shared/components';
import { useWordTap } from '@lingo/shared/hooks/useWordTap';
import { useSentenceTranslation } from '@lingo/shared/hooks/useSentenceTranslation';
import { createInitialSRSState } from '@lingo/shared/srs/leitner';
import { groupIntoStanzas } from '../utils/lyricsAdapter';
import { useApp } from '../context/AppContext';
import { useCallback } from 'react';

interface LyricsReaderProps {
  story: Story;
  onBack: () => void;
}

export function LyricsReader({ story, onBack }: LyricsReaderProps) {
  const { savedWords, saveWord, removeWord } = useApp();
  const { activeWord, enrichedActiveWord, lookupCache, handleWordTap, dismissWord } = useWordTap('da');
  const { toggleTranslation, isShown, hideTranslation } = useSentenceTranslation();

  const handleSentenceTap = useCallback((id: string) => {
    dismissWord();
    toggleTranslation(id);
  }, [dismissWord, toggleTranslation]);

  const handleSaveWord = useCallback(
    (word: WordDefinition, sentence: { id: string; text: string }) => {
      if (savedWords[word.word]) {
        removeWord(word.word);
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
      saveWord(saved);
    },
    [savedWords, story, saveWord, removeWord]
  );

  const speak = useCallback((text: string) => {
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = 'da-DK';
    window.speechSynthesis.speak(utt);
  }, []);

  const stanzas = groupIntoStanzas(story.sentences, story.metadata?.stanzaBreaks);

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>‹ Back</button>
        <h2 className="screen-title" style={{ fontSize: '17px' }}>{story.title}</h2>
      </div>

      {story.metadata?.artist && (
        <div style={{
          textAlign: 'center',
          fontSize: '13px',
          color: 'var(--ink-2)',
          padding: '4px 20px 12px',
        }}>
          ♫ {story.metadata.artist}
        </div>
      )}

      <div className="reader-sentences lyrics-reader" role="list">
        {stanzas.map((stanza, stanzaIdx) => (
          <div
            key={stanzaIdx}
            className={`lyrics-stanza${stanza.isChorus ? ' lyrics-stanza--chorus' : ''}`}
          >
            {stanza.isChorus && (
              <div className="lyrics-stanza-label">Chorus</div>
            )}
            {stanza.lines.map((sentence) => (
              <SentenceCard
                key={sentence.id}
                sentence={sentence}
                story={story}
                isLyrics
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
        ))}
      </div>
    </div>
  );
}
