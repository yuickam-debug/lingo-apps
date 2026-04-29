import { useState, useMemo } from 'react';
import type { Story, SavedWord } from '../types';
import { getWordsDueToday, getBoxCounts, getGraduatedCount } from '../srs/leitner';
import { countWordFrequency } from '../utils/frequency';
import { findContextSentences, type ContextResult } from '../utils/contextSearch';

interface SavedWordsListProps {
  savedWords: Record<string, SavedWord>;
  removeWord: (key: string) => void;
  allContent: Story[];
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightWord(text: string, lemma: string): React.ReactNode[] {
  const parts = text.split(new RegExp(`(${escapeRegex(lemma)})`, 'gi'));
  const lower = lemma.toLowerCase();
  return parts.map((part, i) =>
    part.toLowerCase() === lower ? (
      <strong key={i} className="context-highlight">{part}</strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export function SavedWordsList({ savedWords, removeWord, allContent }: SavedWordsListProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [contextCache, setContextCache] = useState<Record<string, ContextResult[]>>({});

  const words = useMemo(
    () => Object.values(savedWords).sort((a, b) => b.savedAt - a.savedAt),
    [savedWords]
  );

  const freqMap = useMemo<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    for (const w of words) {
      map[w.word] = countWordFrequency(w.word, allContent);
    }
    return map;
  }, [words, allContent]);

  const dueCount = getWordsDueToday(savedWords).length;
  const boxes = getBoxCounts(savedWords);
  const graduated = getGraduatedCount(savedWords);

  const handleExpand = (wordKey: string) => {
    const next = expanded === wordKey ? null : wordKey;
    setExpanded(next);
    if (next && !(next in contextCache)) {
      setContextCache((prev) => ({
        ...prev,
        [next]: findContextSentences(next, allContent),
      }));
    }
  };

  if (words.length === 0) {
    return (
      <div>
        <div className="screen-header">
          <h2 className="screen-title">Saved Words</h2>
        </div>
        <div className="empty-state">
          <div className="empty-icon">⭐</div>
          <div className="empty-title">No saved words yet</div>
          <div className="empty-body">
            Tap any underlined word while reading to save it here for spaced-repetition review.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Saved Words</h2>
        <span style={{ fontSize: '13px', color: 'var(--ink-2)', flexShrink: 0 }}>
          {words.length} total
        </span>
      </div>

      <div className="srs-chips">
        {dueCount > 0 && (
          <span className="srs-chip due">🧠 {dueCount} due today</span>
        )}
        <span className="srs-chip box">Box 1 · {boxes[1]}</span>
        <span className="srs-chip box">Box 2 · {boxes[2]}</span>
        <span className="srs-chip box">Box 3 · {boxes[3]}</span>
        <span className="srs-chip grad">★ {graduated} mastered</span>
      </div>

      <div className="saved-words-list">
        {words.map((w) => {
          const freq = freqMap[w.word] ?? 0;
          const contexts = contextCache[w.word];
          const isExpanded = expanded === w.word;

          return (
            <div
              key={w.word}
              className="saved-word-item"
              onClick={() => handleExpand(w.word)}
            >
              <div className="saved-word-header">
                <span className="saved-word-text">{w.word}</span>
                <span className="saved-word-pos">{w.partOfSpeech}</span>
                <span className="freq-badge">
                  {freq > 0 ? `Seen ${freq}×` : 'Seen in reading'}
                </span>
                {w.srsState.graduated ? (
                  <span className="box-badge graduated">★ Mastered</span>
                ) : (
                  <span className="box-badge">Box {w.srsState.box}</span>
                )}
              </div>

              <div className="saved-word-def">{w.definition}</div>

              {isExpanded && (
                <>
                  {w.grammar && (
                    <div className="saved-word-grammar">{w.grammar}</div>
                  )}

                  <div className="context-cards">
                    {contexts && contexts.length > 0 ? (
                      contexts.map((ctx, i) => (
                        <div key={i} className="context-card">
                          <div className="context-card-title">{ctx.storyTitle}</div>
                          <div className="context-card-sentence">
                            {highlightWord(ctx.sentenceText, w.word)}
                          </div>
                          {ctx.sentenceTranslation && (
                            <div className="context-card-translation">
                              {ctx.sentenceTranslation}
                            </div>
                          )}
                        </div>
                      ))
                    ) : contexts ? (
                      <div className="context-empty">
                        This word was saved from an older story. Context not available.
                      </div>
                    ) : null}
                  </div>

                  <div className="saved-word-actions">
                    <button
                      className="btn-remove"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeWord(w.word);
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
