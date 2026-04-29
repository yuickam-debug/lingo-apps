import { useState, useEffect } from 'react';
import type { Story, CEFRLevel } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';
import { loadStories, refreshStories } from '@lingo/shared/content/contentService';
import deStory001 from '../content/stories/de-story-001.json';
import deStory002 from '../content/stories/de-story-002-struwwelpeter.json';
import deStory003 from '../content/stories/de-story-003-emil-reise-berlin.json';
import deStory004 from '../content/stories/de-story-004-emil-der-plan.json';
import deStory005 from '../content/stories/de-story-005-kleiner-prinz.json';

// Bundled stories as immediate fallback while the network request is in-flight
const BUNDLED: Story[] = [
  deStory001 as unknown as Story,
  deStory002 as unknown as Story,
  deStory003 as unknown as Story,
  deStory004 as unknown as Story,
  deStory005 as unknown as Story,
];

interface StoryLibraryProps {
  onOpenReader: (story: Story) => void;
}

const CEFR_ORDER: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2'];
const CEFR_LABEL: Record<CEFRLevel, string> = { A1: 'Beginner', A2: 'Elementary', B1: 'Intermediate', B2: 'Upper-Intermediate' };

export function StoryLibrary({ onOpenReader }: StoryLibraryProps) {
  const [stories, setStories] = useState<Story[]>(BUNDLED);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadStories('de', BUNDLED).then((s) => {
      if (!cancelled) {
        setStories(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSync() {
    setSyncing(true);
    const fresh = await refreshStories('de');
    const ids = new Set(fresh.map((s) => s.id));
    setStories([...fresh, ...BUNDLED.filter((s) => !ids.has(s.id))]);
    setSyncing(false);
  }

  const grouped = CEFR_ORDER.reduce<Record<CEFRLevel, Story[]>>(
    (acc, lvl) => { acc[lvl] = stories.filter((s) => s.level === lvl); return acc; },
    { A1: [], A2: [], B1: [], B2: [] }
  );

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Story Library</h2>
        {loading ? (
          <div className="spinner" style={{ flexShrink: 0 }} />
        ) : (
          <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
            {stories.length} {stories.length === 1 ? 'story' : 'stories'}
          </span>
        )}
        <button
          className="btn-icon"
          onClick={handleSync}
          disabled={syncing || loading}
          title="Sync new stories"
          style={{ fontSize: '20px', opacity: syncing ? 1 : undefined }}
        >
          {syncing ? <div className="spinner" /> : '↻'}
        </button>
      </div>

      {CEFR_ORDER.filter((lvl) => grouped[lvl].length > 0).map((lvl) => (
        <div key={lvl}>
          <div className="section-header">{lvl} · {CEFR_LABEL[lvl]}</div>
          <div className="story-list">
            {grouped[lvl].map((story) => (
              <button
                key={story.id}
                className="story-item"
                onClick={() => onOpenReader(story)}
              >
                <div className="story-item-info">
                  <div className="story-item-title">{story.title}</div>
                  {story.metadata?.titleEn && (
                    <div style={{ fontSize: '12px', color: 'var(--ink-2)', marginBottom: '3px' }}>
                      {story.metadata.titleEn}
                    </div>
                  )}
                  <div className="story-item-meta">
                    <CEFRBadge level={story.level} />
                    <span>{story.sentences.length} sentences</span>
                    {story.metadata?.tags?.slice(0, 1).map((t) => (
                      <span key={t} style={{
                        padding: '1px 6px', borderRadius: '10px',
                        background: 'var(--border)', fontSize: '11px',
                      }}>
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <span className="story-item-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
