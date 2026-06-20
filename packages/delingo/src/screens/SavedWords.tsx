import type { Story, NewsWeek } from '@lingo/shared/types';
import { SavedWordsList } from '@lingo/shared/components';
import { getWordsDueToday } from '@lingo/shared/srs/leitner';
import { adaptManifest, type MCManifest } from '@lingo/shared/content/contentAdapter';
import bundledManifest from '@lingo/shared/content/data.json';
import week20260421 from '../content/news/week-2026-04-21.json';
import week20260414 from '../content/news/week-2026-04-14.json';
import deStory001 from '../content/stories/de-story-001.json';
import { useApp } from '../context/AppContext';

// News first (most recent week first) so context results surface news before stories
const ALL_CONTENT: Story[] = [
  ...(week20260421 as unknown as NewsWeek).articles,
  ...(week20260414 as unknown as NewsWeek).articles,
  deStory001 as unknown as Story,
  ...adaptManifest(bundledManifest as MCManifest, 'de'),
];

interface SavedWordsProps {
  onStartReview: () => void;
}

export function SavedWords({ onStartReview }: SavedWordsProps) {
  const { savedWords, removeWord } = useApp();
  const dueCount = getWordsDueToday(savedWords).length;

  return (
    <div>
      {dueCount > 0 && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '12px 20px 4px',
          padding: '10px 14px',
          background: 'var(--accent-light)',
          borderRadius: 'var(--radius)',
          gap: '12px',
        }}>
          <span style={{ fontSize: '14px', color: 'var(--accent)' }}>
            {dueCount} word{dueCount !== 1 ? 's' : ''} ready to review
          </span>
          <button
            onClick={onStartReview}
            style={{
              flexShrink: 0,
              padding: '6px 14px',
              borderRadius: '20px',
              border: '1.5px solid var(--accent)',
              background: 'transparent',
              color: 'var(--accent)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            Start Review
          </button>
        </div>
      )}
      <SavedWordsList
        savedWords={savedWords}
        removeWord={removeWord}
        allContent={ALL_CONTENT}
      />
    </div>
  );
}
