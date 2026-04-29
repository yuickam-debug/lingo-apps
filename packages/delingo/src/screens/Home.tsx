import { useState, useEffect } from 'react';
import type { Story } from '@lingo/shared/types';
import { getWordsDueToday, getBoxCounts, getGraduatedCount } from '@lingo/shared/srs/leitner';
import { loadStories } from '@lingo/shared/content/contentService';
import { useApp } from '../context/AppContext';
import deStory001 from '../content/stories/de-story-001.json';

type Screen = 'home' | 'library' | 'news' | 'saved' | 'settings';

interface HomeProps {
  onNavigate: (screen: Screen) => void;
  onOpenReader: (story: Story) => void;
}

const BUNDLED: Story[] = [deStory001 as unknown as Story];

export function Home({ onNavigate, onOpenReader }: HomeProps) {
  const { savedWords } = useApp();
  const [featured, setFeatured] = useState<Story>(BUNDLED[0]);

  const dueCount = getWordsDueToday(savedWords).length;
  const totalSaved = Object.keys(savedWords).length;
  const graduated = getGraduatedCount(savedWords);
  const boxes = getBoxCounts(savedWords);
  const inReview = boxes[1] + boxes[2] + boxes[3];

  useEffect(() => {
    loadStories('de', BUNDLED).then((stories) => {
      if (stories.length > 0) setFeatured(stories[0]);
    });
  }, []);

  return (
    <div>
      <div className="home-hero">
        <h1 className="home-greeting">Guten Morgen 👋</h1>
        <p className="home-subtitle">DELingo · German comprehensible input</p>
      </div>

      {dueCount > 0 && (
        <button className="review-nudge" onClick={() => onNavigate('saved')}>
          <span className="nudge-icon">🧠</span>
          <div>
            <div className="nudge-count">{dueCount} word{dueCount !== 1 ? 's' : ''} to review</div>
            <div className="nudge-label">Tap to see your saved words</div>
          </div>
          <span className="nudge-arrow">›</span>
        </button>
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

      <button className="cta-card" onClick={() => onNavigate('news')}>
        <span className="cta-icon">📰</span>
        <div className="cta-info">
          <div className="cta-title">Weekly News</div>
          <div className="cta-subtitle">Current events in simple German</div>
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
