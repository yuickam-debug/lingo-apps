import { useState, useEffect, useCallback } from 'react';
import type { CSSProperties } from 'react';
import type { ClozeCard } from '../srs/leitner';
import { useReviewSession } from '../hooks/useReviewSession';
import { ClozeCardView } from './ClozeCardView';

interface ReviewSessionProps {
  onClose: () => void;
}

export const ReviewSession = ({ onClose }: ReviewSessionProps) => {
  const {
    currentCard,
    currentIndex,
    totalCards,
    sessionComplete,
    isLoading,
    isEmpty,
    submitAnswer,
    sessionStats,
    streak,
  } = useReviewSession();

  const [isAnswering, setIsAnswering] = useState(false);

  const handleAnswer = useCallback(
    (correct: boolean) => {
      setIsAnswering(true);
      submitAnswer(correct);
    },
    [submitAnswer],
  );

  // Clear the answering lock once the hook advances to the next card
  useEffect(() => {
    setIsAnswering(false);
  }, [currentIndex, sessionComplete]);

  // ── Loading ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={S.shell}>
        <div style={S.centered}>
          <div className="loading-row">
            <span className="spinner" />
            Loading…
          </div>
        </div>
      </div>
    );
  }

  // ── Empty ──────────────────────────────────────────────────────────
  if (isEmpty) {
    return (
      <div style={S.shell}>
        <div style={S.centered}>
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-title">All caught up!</div>
            <div className="empty-body">
              No words are due for review right now. Keep reading to save more words.
            </div>
            {streak > 0 && (
              <p style={S.streakLabel}>🔥 {streak} day streak</p>
            )}
          </div>
          <button style={{ ...S.btnPrimary, marginTop: '28px' }} onClick={onClose}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ── Complete ───────────────────────────────────────────────────────
  if (sessionComplete) {
    const total = sessionStats.correct + sessionStats.incorrect;
    return (
      <div style={S.shell}>
        <div style={S.centered}>
          <div style={S.summaryCard}>
            <h2 style={S.summaryHeading}>Session complete 🎉</h2>

            <div style={S.statsRow}>
              <div style={S.statBlock}>
                <span style={{ ...S.statValue, color: 'var(--color-correct)' }}>
                  {sessionStats.correct}
                </span>
                <span style={S.statLabel}>Correct</span>
              </div>
              <div style={S.statBlock}>
                <span style={{ ...S.statValue, color: '#E53E3E' }}>
                  {sessionStats.incorrect}
                </span>
                <span style={S.statLabel}>Incorrect</span>
              </div>
            </div>

            <p style={S.retentionLabel}>
              {sessionStats.correct} / {total} correct this session
            </p>

            {streak > 0 && (
              <p style={S.streakLabel}>🔥 {streak} day streak</p>
            )}

            <div style={S.summaryActions}>
              <button style={S.btnPrimary} onClick={onClose}>
                Done
              </button>
              <button style={S.btnSecondary} onClick={() => window.location.reload()}>
                Review again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Active session ─────────────────────────────────────────────────
  const fillPct = totalCards > 0 ? (currentIndex / totalCards) * 100 : 0;

  return (
    <div style={S.shell}>
      {/* Header */}
      <div style={S.header}>
        <button className="btn-back" onClick={onClose} aria-label="Close review session">
          ← Back
        </button>
        <p style={S.title}>Review</p>
        <span style={S.counter} aria-live="polite" aria-label="Card position">
          {currentIndex + 1} / {totalCards}
        </span>
      </div>

      {/* Progress bar */}
      <div style={S.progressTrack} role="progressbar" aria-valuenow={currentIndex} aria-valuemax={totalCards}>
        <div style={{ ...S.progressFill, width: `${fillPct}%` }} />
      </div>

      {/* Card area */}
      <div style={S.cardArea}>
        {currentCard && (
          <ClozeCardView
            card={currentCard as ClozeCard & { options: string[] }}
            onAnswer={handleAnswer}
            disabled={isAnswering}
          />
        )}
      </div>
    </div>
  );
};

// ── Styles ─────────────────────────────────────────────────────────────
// Follows the fixed-position centering pattern from ShadowingPlayer.tsx.
// CSS variables (--accent, --color-correct, --bg, --card, --ink, --ink-2,
// --border, --radius, --radius-lg, --shadow, --transition, --warm) are
// resolved per-app. No new design tokens introduced.

const S: Record<string, CSSProperties> = {
  shell: {
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: '50%',
    transform: 'translateX(-50%)',
    width: '100%',
    maxWidth: '640px',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
    zIndex: 200,
    overflow: 'hidden',
  },

  // ── Loading / empty / complete centring wrapper
  centered: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    overflowY: 'auto',
  },

  // ── Header (matches ShadowingPlayer exactly)
  header: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '14px 20px 12px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg)',
  },
  title: {
    flex: 1,
    margin: 0,
    fontSize: '17px',
    fontWeight: 700,
    color: 'var(--ink)',
    textAlign: 'center',
  },
  counter: {
    flexShrink: 0,
    minWidth: '52px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--ink-2)',
  },

  // ── Progress bar
  progressTrack: {
    flexShrink: 0,
    height: '8px',
    background: 'var(--border)',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    transition: 'width 0.3s ease',
  },

  // ── Scrollable card area
  cardArea: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
  },

  // ── Complete screen
  summaryCard: {
    width: '100%',
    background: 'var(--card)',
    borderRadius: 'var(--radius-lg)',
    boxShadow: 'var(--shadow)',
    padding: '32px 24px 28px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
  },
  summaryHeading: {
    margin: 0,
    fontSize: '22px',
    fontWeight: 800,
    color: 'var(--ink)',
    textAlign: 'center',
  },
  statsRow: {
    display: 'flex',
    gap: '32px',
    justifyContent: 'center',
  },
  statBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  statValue: {
    fontSize: '40px',
    fontWeight: 800,
    lineHeight: 1,
  },
  statLabel: {
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ink-2)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  retentionLabel: {
    margin: 0,
    fontSize: '15px',
    color: 'var(--ink-2)',
    textAlign: 'center',
  },
  streakLabel: {
    margin: 0,
    fontSize: '15px',
    fontWeight: 600,
    color: 'var(--warm)',
    textAlign: 'center',
  },
  summaryActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    width: '100%',
  },

  // ── Shared buttons
  btnPrimary: {
    width: '100%',
    padding: '14px',
    borderRadius: '24px',
    border: 'none',
    background: 'var(--accent)',
    color: 'white',
    fontSize: '16px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity var(--transition)',
  },
  btnSecondary: {
    width: '100%',
    padding: '14px',
    borderRadius: '24px',
    border: '1.5px solid var(--border)',
    background: 'transparent',
    color: 'var(--ink-2)',
    fontSize: '16px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'opacity var(--transition)',
  },
};
