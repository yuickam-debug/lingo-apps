import type { Sentence, Story, WordDefinition } from '../types';

interface SentenceCardProps {
  sentence: Sentence;
  story: Story;
  isSaved: (word: WordDefinition) => boolean;
  showTranslation: boolean;
  activeWord: WordDefinition | null;
  isLyrics: boolean;
  onSentenceTap: () => void;
  onWordTap: (word: WordDefinition, e: React.MouseEvent) => void;
  onSaveWord: (word: WordDefinition) => void;
  onSpeak: () => void;
}

interface Token {
  text: string;
  wordDef?: WordDefinition;
}

// Matches sequences of letters including German/Danish special characters
const WORD_RE = /([a-zA-ZäöüÄÖÜßàáâãåæøÆØÅ]{2,})/;

function tokenize(text: string, vocabWords: WordDefinition[]): Token[] {
  // Map exact lowercase form → vocab WordDefinition (curated definitions win)
  const vocabMap = new Map<string, WordDefinition>();
  for (const w of vocabWords) {
    vocabMap.set(w.word.toLowerCase(), w);
  }

  // Split into alternating non-word / word segments
  return text
    .split(WORD_RE)
    .filter((seg) => seg.length > 0)
    .map((seg) => {
      if (WORD_RE.test(seg)) {
        const lower = seg.toLowerCase();
        // Use curated vocab definition if available, otherwise a stub that
        // triggers an async Wiktionary lookup in Reader
        const wordDef: WordDefinition =
          vocabMap.get(lower) ?? { word: lower, definition: '', partOfSpeech: '' };
        return { text: seg, wordDef };
      }
      return { text: seg };
    });
}

export function SentenceCard({
  sentence,
  isSaved,
  showTranslation,
  activeWord,
  isLyrics,
  onSentenceTap,
  onWordTap,
  onSaveWord,
  onSpeak,
}: SentenceCardProps) {
  const tokens = tokenize(sentence.text, sentence.words);
  const isActiveWordSaved = activeWord ? isSaved(activeWord) : false;

  return (
    <div className={`sentence-card${isLyrics ? ' lyrics' : ''}`}>
      <div className="sentence-body">
        <p
          className="sentence-text"
          onClick={sentence.translation ? onSentenceTap : undefined}
          title={sentence.translation ? 'Tap to show/hide translation' : undefined}
          style={sentence.translation ? undefined : { cursor: 'default' }}
        >
          {tokens.map((tok, i) =>
            tok.wordDef ? (
              <span
                key={i}
                className={[
                  'word-token',
                  activeWord?.word === tok.wordDef.word ? 'active' : '',
                  isSaved(tok.wordDef) ? 'saved' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={(e) => onWordTap(tok.wordDef!, e)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onWordTap(tok.wordDef!, e as unknown as React.MouseEvent);
                  }
                }}
              >
                {tok.text}
              </span>
            ) : (
              <span key={i}>{tok.text}</span>
            )
          )}
        </p>

        <button
          className="btn-icon"
          onClick={(e) => { e.stopPropagation(); onSpeak(); }}
          title="Listen"
          aria-label="Play sentence"
        >
          🔊
        </button>
      </div>

      {showTranslation && (
        <p className="sentence-translation">{sentence.translation}</p>
      )}

      {activeWord && (
        <div className="word-detail">
          <div className="word-detail-header">
            <span className="word-detail-word">{activeWord.word}</span>
            <span className="word-detail-pos">{activeWord.partOfSpeech}</span>
          </div>
          <p className="word-detail-def">{activeWord.definition}</p>
          {activeWord.grammar && (
            <p className="word-detail-grammar">{activeWord.grammar}</p>
          )}
          <button
            className={`btn-save${isActiveWordSaved ? ' saved' : ''}`}
            onClick={() => onSaveWord(activeWord)}
          >
            {isActiveWordSaved ? '★ Saved' : '☆ Save word'}
          </button>
        </div>
      )}
    </div>
  );
}
