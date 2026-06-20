import { useEffect, useRef } from 'react';
import type { CSSProperties } from 'react';
import type { Story } from '../types';
import { useShadowingPlayer } from '../hooks/useShadowingPlayer';

interface ShadowingPlayerProps {
  story: Story;
  lang: 'de' | 'da';
  onClose: () => void;
}

export const ShadowingPlayer = ({ story, lang, onClose }: ShadowingPlayerProps) => {
  const sentences = story.sentences.map((s) => s.text);
  const total = sentences.length;

  const { play, pause, stop, currentIndex, isPlaying, loopCountdown, loopSentence } =
    useShadowingPlayer(sentences, story.id, lang);

  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    rowRefs.current[currentIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentIndex]);

  const handleClose = () => {
    stop();
    onClose();
  };

  const counterText = isPlaying ? `${currentIndex + 1} / ${total}` : `– / ${total}`;

  return (
    <div style={S.shell}>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={S.header}>
        <button className="btn-back" onClick={handleClose} aria-label="Close shadowing session">
          ← Back
        </button>

        <p style={S.title}>{story.title}</p>

        <span style={S.counter} aria-live="polite" aria-label="Sentence position">
          {counterText}
        </span>
      </div>

      {/* ── Sentence list ───────────────────────────────────────── */}
      <div style={S.list} role="list">
        {story.sentences.map((sentence, index) => {
          const active = index === currentIndex;
          return (
            <div
              key={sentence.id}
              role="listitem"
              ref={(el) => { rowRefs.current[index] = el; }}
              style={active ? { ...S.row, ...S.rowActive } : S.row}
            >
              <span style={S.sentenceText}>{sentence.text}</span>

              <div style={S.rowEnd}>
                {active && loopCountdown !== null && (
                  <span style={S.loopCountdown} aria-live="polite">
                    ×{loopCountdown} left
                  </span>
                )}
                <button
                  style={S.loopBtn}
                  onClick={() => loopSentence(index, 3)}
                  aria-label="Loop this sentence 3 times"
                  title="Loop ×3"
                >
                  ↺ ×3
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Controls bar ────────────────────────────────────────── */}
      <div style={S.controls}>
        {isPlaying ? (
          <button style={{ ...S.ctrlBtn, ...S.ctrlPause }} onClick={pause}>
            ⏸ Pause
          </button>
        ) : (
          <button style={{ ...S.ctrlBtn, ...S.ctrlPlay }} onClick={play}>
            ▶ Play
          </button>
        )}
        <button style={{ ...S.ctrlBtn, ...S.ctrlStop }} onClick={stop}>
          ⏹ Stop
        </button>
      </div>
    </div>
  );
};

// ── Styles ────────────────────────────────────────────────────────
// Follows the fixed-position centering pattern used by .nav-bar in shared.css.
// CSS variables (--accent, --accent-light, --bg, --card, --ink, --ink-2, --border,
// --transition) are resolved per-app; no new design tokens are introduced here.

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
  },

  // ── Header
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
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  counter: {
    flexShrink: 0,
    minWidth: '52px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: 600,
    color: 'var(--ink-2)',
  },

  // ── Sentence list
  list: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  // Every row carries a transparent 4-px left border so the text never
  // shifts horizontally when the active border colour is applied.
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 20px',
    borderBottom: '1px solid var(--border)',
    borderLeft: '4px solid transparent',
    transition: 'background var(--transition), border-left-color var(--transition)',
  },
  rowActive: {
    background: 'var(--accent-light)',
    borderLeftColor: 'var(--accent)',
  },
  sentenceText: {
    flex: 1,
    fontSize: '17px',
    lineHeight: 1.65,
    color: 'var(--ink)',
  },
  rowEnd: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    flexShrink: 0,
  },
  loopCountdown: {
    fontSize: '11px',
    fontWeight: 700,
    color: 'var(--accent)',
    background: 'var(--accent-light)',
    padding: '2px 7px',
    borderRadius: '10px',
    whiteSpace: 'nowrap',
  },
  loopBtn: {
    background: 'none',
    border: '1.5px solid var(--border)',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: 600,
    color: 'var(--ink-2)',
    padding: '4px 8px',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    lineHeight: 1,
  },

  // ── Controls bar
  controls: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    padding: '16px 20px',
    // Respect iOS home indicator on Capacitor builds
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
    background: 'var(--card)',
    borderTop: '1px solid var(--border)',
  },
  ctrlBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '12px 28px',
    borderRadius: '24px',
    fontSize: '15px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'opacity var(--transition)',
    border: '1.5px solid var(--border)',
    background: 'var(--card)',
    color: 'var(--ink)',
    minWidth: '110px',
  },
  ctrlPlay: {
    background: 'var(--accent)',
    color: 'white',
    borderColor: 'var(--accent)',
  },
  ctrlPause: {
    // inherits ctrlBtn defaults — no override needed
  },
  ctrlStop: {
    color: 'var(--ink-2)',
  },
};
