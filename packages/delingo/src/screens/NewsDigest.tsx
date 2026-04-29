import { useState } from 'react';
import type { Story } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';

// TODO: replace with dynamic fetch in v2
import week20260414 from '../content/news/week-2026-04-14.json';
import week20260420 from '../content/news/week-2026-04-20.json';
import week20260421 from '../content/news/week-2026-04-21.json';

interface WeekData {
  weekOf: string;
  articles: Story[];
}

/**
 * Returns all available week files sorted oldest → newest.
 * To add a new week: import the JSON above and add it to this array.
 */
function getWeekFiles(): WeekData[] {
  return [
    week20260414 as unknown as WeekData,
    week20260420 as unknown as WeekData,
    week20260421 as unknown as WeekData,
  ].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
}

const WEEKS = getWeekFiles();
const LATEST_INDEX = WEEKS.length - 1;

function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatWeekHeader(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

interface NewsDigestProps {
  onOpenReader: (story: Story) => void;
}

export function NewsDigest({ onOpenReader }: NewsDigestProps) {
  const [weekIndex, setWeekIndex] = useState(LATEST_INDEX);

  const week = WEEKS[weekIndex];
  const isLatest = weekIndex === LATEST_INDEX;

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Nachrichten</h2>
        <span style={{ fontSize: '13px', color: 'var(--ink-2)', flexShrink: 0 }}>
          {formatWeekHeader(week.weekOf)}
        </span>
      </div>

      <div className="news-week-nav">
        <button
          className="news-week-btn"
          onClick={() => setWeekIndex((i) => i - 1)}
          disabled={weekIndex === 0}
          aria-label="Vorherige Woche"
        >
          ← Vorherige
        </button>
        <span className="news-week-label">
          {isLatest ? 'Diese Woche' : `Woche ${week.weekOf}`}
        </span>
        <button
          className="news-week-btn"
          onClick={() => setWeekIndex((i) => i + 1)}
          disabled={isLatest}
          aria-label="Nächste Woche"
        >
          Nächste →
        </button>
      </div>

      <p className="section-header">
        {isLatest ? 'Diese Woche' : `Woche vom ${formatWeekHeader(week.weekOf)}`}
      </p>

      <div className="story-list">
        {week.articles.map((article) => (
          <button
            key={article.id}
            className="story-item"
            onClick={() => onOpenReader(article)}
          >
            <div className="story-item-info">
              <div className="news-card-tags">
                {article.metadata?.topic && (
                  <span className="news-topic-tag">
                    {article.metadata.topic.toUpperCase()}
                  </span>
                )}
                {isLatest && <span className="news-new-badge">NEU</span>}
              </div>

              <div className="story-item-title news-card-title">
                {article.title}
              </div>

              <div className="story-item-meta">
                <CEFRBadge level={article.level} />
                {article.metadata?.publishedDate && (
                  <span>{formatDate(article.metadata.publishedDate)}</span>
                )}
                <span>{article.sentences.length} Sätze</span>
              </div>
            </div>
            <span className="story-item-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
