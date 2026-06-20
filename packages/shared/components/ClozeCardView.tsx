import { useState, useEffect, useCallback } from 'react';
import type { ClozeCard } from '../srs/leitner';

interface ClozeCardViewProps {
  card: ClozeCard & { options: string[] };
  onAnswer: (correct: boolean) => void;
  disabled: boolean;
}

type OptionState = 'default' | 'correct' | 'incorrect' | 'reveal';

function getOptionState(
  option: string,
  selected: string | null,
  correctWord: string,
): OptionState {
  if (selected === null) return 'default';
  if (option === selected) return option === correctWord ? 'correct' : 'incorrect';
  if (option === correctWord && selected !== correctWord) return 'reveal';
  return 'default';
}

const OPTION_STYLES: Record<OptionState, React.CSSProperties> = {
  default: {},
  correct: { background: 'var(--color-correct)', color: 'white', borderColor: 'var(--color-correct)' },
  incorrect: { background: '#E53E3E', color: 'white', borderColor: '#E53E3E' },
  reveal: { background: 'var(--color-correct)', color: 'white', borderColor: 'var(--color-correct)' },
};

export const ClozeCardView = ({ card, onAnswer, disabled }: ClozeCardViewProps) => {
  const [selected, setSelected] = useState<string | null>(null);

  // Reset when a new card arrives
  useEffect(() => {
    setSelected(null);
  }, [card.word.word, card.clozeText]);

  const speak = useCallback(() => {
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(new SpeechSynthesisUtterance(card.sentence));
  }, [card.sentence]);

  const handleOption = useCallback(
    (option: string) => {
      if (disabled || selected !== null) return;
      setSelected(option);
      const correct = option === card.word.word;
      setTimeout(() => {
        onAnswer(correct);
      }, 900);
    },
    [disabled, selected, card.word.word, onAnswer],
  );

  const correctWord = card.word.word;
  const isAnswered = selected !== null;
  const hint = [card.word.partOfSpeech, card.word.grammar].filter(Boolean).join(' · ');

  return (
    <div
      style={{
        background: 'var(--card)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow)',
        padding: '28px 20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      {/* ── Sentence ── */}
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            fontSize: '20px',
            lineHeight: '1.65',
            color: 'var(--ink)',
            fontWeight: 500,
            marginBottom: '10px',
          }}
        >
          {card.clozeText}
        </p>
        <p style={{ fontSize: '12px', color: 'var(--ink-2)', marginBottom: '10px' }}>
          From: {card.storyTitle}
        </p>
        <button
          className="btn-icon"
          onClick={speak}
          aria-label="Listen to sentence"
          title="Listen"
        >
          🔊
        </button>
      </div>

      {/* ── Options ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {card.options.map((option) => {
          const state = getOptionState(option, selected, correctWord);
          const isInteractive = !disabled && !isAnswered;
          return (
            <button
              key={option}
              onClick={() => handleOption(option)}
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 'var(--radius)',
                border: '1.5px solid var(--accent)',
                background: 'transparent',
                color: 'var(--accent)',
                fontSize: '16px',
                fontWeight: 600,
                cursor: isInteractive ? 'pointer' : 'default',
                opacity: disabled && !isAnswered ? 0.6 : 1,
                transition: 'background var(--transition), color var(--transition), border-color var(--transition)',
                textAlign: 'left',
                ...OPTION_STYLES[state],
              }}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* ── Grammar hint ── */}
      {hint && (
        <p style={{ fontSize: '12px', color: 'var(--ink-2)', textAlign: 'center' }}>
          {hint}
        </p>
      )}
    </div>
  );
};
