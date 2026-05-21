import { useState, useEffect } from 'react';
import type { Story } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';

import week20260414 from '../content/news/week-2026-04-14.json';
import week20260420 from '../content/news/week-2026-04-20.json';
import week20260421 from '../content/news/week-2026-04-21.json';
import week20260525 from '../content/news/week-2026-05-25.json';

interface WeekData {
  weekOf: string;
  articles: Story[];
}

const BUNDLE_URL =
  'https://raw.githubusercontent.com/yuickam-debug/lingo-apps/main/packages/delingo/src/content/news/de-news-bundle.json';
const CACHE_KEY = 'lingo_news_de_v1';
const CACHE_TS_KEY = 'lingo_news_de_v1_ts';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const BUNDLED: WeekData[] = [
  week20260414 as unknown as WeekData,
  week20260420 as unknown as WeekData,
  week20260421 as unknown as WeekData,
  week20260525 as unknown as WeekData,
];

function mergeWeeks(base: WeekData[], remote: WeekData[]): WeekData[] {
  const map = new Map<string, WeekData>();
  for (const w of base) map.set(w.weekOf, w);
  for (const w of remote) map.set(w.weekOf, w); // remote wins
  return [...map.values()].sort((a, b) => a.weekOf.localeCompare(b.weekOf));
}

function readCache(): { weeks: WeekData[]; fresh: boolean } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!raw || !ts) return null;
    return { weeks: JSON.parse(raw) as WeekData[], fresh: Date.now() - Number(ts) < CACHE_TTL };
  } catch {
    return null;
  }
}

function writeCache(weeks: WeekData[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(weeks));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {}
}

function getInitialWeeks(): WeekData[] {
  const cached = readCache();
  return cached ? mergeWeeks(BUNDLED, cached.weeks) : BUNDLED;
}

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
  const [weeks, setWeeks] = useState<WeekData[]>(getInitialWeeks);
  const [weekIndex, setWeekIndex] = useState<number>(() => getInitialWeeks().length - 1);

  useEffect(() => {
    const cached = readCache();
    if (cached?.fresh) return;

    fetch(BUNDLE_URL)
      .then(r => (r.ok ? r.json() : null))
      .then((bundle: { weeks: WeekData[] } | null) => {
        if (!bundle?.weeks?.length) return;
        writeCache(bundle.weeks);
        const merged = mergeWeeks(BUNDLED, bundle.weeks);
        setWeeks(merged);
        setWeekIndex(merged.length - 1);
      })
      .catch(() => {});
  }, []);

  const week = weeks[weekIndex];
  const isLatest = weekIndex === weeks.length - 1;

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
