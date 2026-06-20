import { useState, useEffect } from 'react';
import type { Story } from '@lingo/shared/types';
import { getWordsDueToday, getBoxCounts, getGraduatedCount, getRetentionRate } from '@lingo/shared/srs/leitner';
import { loadStories } from '@lingo/shared/content/contentService';
import { useApp } from '../context/AppContext';
import daStory001 from '../content/stories/da-story-001.json';

type Screen = 'home' | 'library' | 'lyrics' | 'saved' | 'settings';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenReader: (story: Story) => void;
  onStartReview: () => void;
}

const BUNDLED: Story[] = [daStory001 as unknown as Story];

export function Home({ onNavigate, onOpenReader, onStartReview }: HomeProps) {
  const { savedWords } = useApp();
  const [featured, setFeatured] = useState<Story>(BUNDLED[0]);

  const dueCount = getWordsDueToday(savedWords).length;
  const totalSaved = Object.keys(savedWords).length;
  const graduated = getGraduatedCount(savedWords);
  const boxes = getBoxCounts(savedWords);
  const inReview = boxes[1] + boxes[2] + boxes[3];
  const retentionRate = getRetentionRate(savedWords);
  const hasReviewHistory = boxes[2] + boxes[3] + graduated > 0;

  useEffect(() => {
    loadStories('da', BUNDLED).then((stories) => {
      if (stories.length > 0) setFeatured(stories[0]);
    });
  }, []);

  return (
    <div>
      <style>{`
        @keyframes reviewPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.85; }
        }
      `}</style>

      <div className="home-hero">
        <h1 className="home-greeting">Godmorgen 👋</h1>
        <p className="home-subtitle">DALingo · Danish comprehensible input</p>
      </div>

      {dueCount > 0 && (
        <button
          className="review-nudge"
          style={{ animation: 'reviewPulse 2s ease-in-out infinite' }}
          onClick={onStartReview}
        >
          <span className="nudge-icon">🧠</span>
          <div>
            <div className="nudge-count">Review · {dueCount} due</div>
            <div className="nudge-label">Tap to start your review session</div>
          </div>
          <span className="nudge-arrow">›</span>
        </button>
      )}

      {hasReviewHistory && (
        <div style={{ display: 'flex', gap: '8px', margin: '0 20px 12px' }}>
          {[
            { label: 'Learning',  value: boxes[1] + boxes[2] },
            { label: 'Mastered',  value: graduated },
            { label: 'Retention', value: `${retentionRate}%` },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '10px 8px',
                background: 'var(--border)',
                borderRadius: 'var(--radius-sm)',
              }}
            >
              <span style={{ fontSize: '18px', fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>
                {value}
              </span>
              <span style={{ fontSize: '11px', color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: '3px' }}>
                {label}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-value">{totalSaved}</div>
          <div className="stat-label">Saved</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{inReview}</div>
          <div className="stat-label">In Review</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">{graduated}</div>
          <div className="stat-label">Mastered</div>
        </div>
      </div>

      <p className="section-header">Start Reading</p>

      <button className="cta-card" onClick={() => onNavigate('library')}>
        <span className="cta-icon">📖</span>
        <div className="cta-info">
          <div className="cta-title">Story Library</div>
          <div className="cta-subtitle">Short stories for every level</div>
        </div>
        <span className="cta-arrow">›</span>
      </button>

      <button className="cta-card" onClick={() => onNavigate('lyrics')}>
        <span className="cta-icon">🎵</span>
        <div className="cta-info">
          <div className="cta-title">Lyrics</div>
          <div className="cta-subtitle">Danish songs with word annotations</div>
        </div>
        <span className="cta-arrow">›</span>
      </button>

      <p className="section-header">Featured</p>

      <button className="cta-card" onClick={() => onOpenReader(featured)}>
        <span className="cta-icon">⭐</span>
        <div className="cta-info">
          <div className="cta-title">{featured.title}</div>
          <div className="cta-subtitle">
            {featured.metadata?.titleEn
              ? `${featured.metadata.titleEn} · ${featured.level}`
              : `Featured story · ${featured.level}`}
          </div>
        </div>
        <span className="cta-arrow">›</span>
      </button>
    </div>
  );
}
