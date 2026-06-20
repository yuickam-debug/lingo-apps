import type { Story } from '@lingo/shared/types';
import { SavedWordsList } from '@lingo/shared/components';
import { getWordsDueToday } from '@lingo/shared/srs/leitner';
import { adaptManifest, type MCManifest } from '@lingo/shared/content/contentAdapter';
import bundledManifest from '@lingo/shared/content/data.json';
import daStory001 from '../content/stories/da-story-001.json';
import daLyrics001 from '../content/lyrics/da-lyrics-001.json';
import { useApp } from '../context/AppContext';

// News items are ordered first so findContextSentences returns them before stories
const ALL_CONTENT: Story[] = [
  daStory001 as unknown as Story,
  daLyrics001 as unknown as Story,
  ...adaptManifest(bundledManifest as MCManifest, 'da'),
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
