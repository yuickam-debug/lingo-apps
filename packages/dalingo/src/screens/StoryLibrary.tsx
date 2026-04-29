import { useState, useEffect } from 'react';
import type { Story, CEFRLevel } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';
import { loadStories, refreshStories } from '@lingo/shared/content/contentService';
import daStory001 from '../content/stories/da-story-001.json';
import daStory002 from '../content/stories/da-story-002-pippi-det-nye-hus.json';
import daStory003 from '../content/stories/da-story-003-pippi-markedet.json';
import daStory004 from '../content/stories/da-story-004-pippi-regnvejret.json';
import daStory005 from '../content/stories/da-story-005-elverhoej-dansen.json';

const BUNDLED: Story[] = [
  daStory001 as unknown as Story,
  daStory002 as unknown as Story,
  daStory003 as unknown as Story,
  daStory004 as unknown as Story,
  daStory005 as unknown as Story,
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
    loadStories('da', BUNDLED).then((s) => {
      if (!cancelled) {
        setStories(s);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  async function handleSync() {
    setSyncing(true);
    const fresh = await refreshStories('da');
    // Re-merge BUNDLED so locally-authored stories are never lost after sync
    const ids = new Set(fresh.map((s) => s.id));
    setStories([...fresh, ...BUNDLED.filter((s) => !ids.has(s.id))]);
    setSyncing(false);
  }

  const storyItems = stories.filter((s) => s.source !== 'lyrics');

  const grouped = CEFR_ORDER.reduce<Record<CEFRLevel, Story[]>>(
    (acc, lvl) => { acc[lvl] = storyItems.filter((s) => s.level === lvl); return acc; },
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
            {storyItems.length} {storyItems.length === 1 ? 'story' : 'stories'}
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

      {/* Stories grouped by CEFR level */}
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
