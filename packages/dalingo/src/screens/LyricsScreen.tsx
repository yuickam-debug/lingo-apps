import type { Story, CEFRLevel } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';
import daLyrics001 from '../content/lyrics/da-lyrics-001.json';
import daGldDetKunVigtigt from '../content/lyrics/da-gld-det-kun-vigtigt.json';
import daGldVilDuNoget from '../content/lyrics/da-gld-vil-du-noget.json';
import daGldHalskade from '../content/lyrics/da-gld-halskade.json';
import daGldHvordanSerGudUd from '../content/lyrics/da-gld-hvordan-ser-gud-ud.json';
import daGldMoensKlint from '../content/lyrics/da-gld-moens-klint.json';
import daGldForstarDu from '../content/lyrics/da-gld-forstar-du.json';

const CEFR_ORDER: Record<CEFRLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

const ALL_LYRICS: Story[] = [
  daLyrics001 as unknown as Story,
  daGldDetKunVigtigt as unknown as Story,
  daGldVilDuNoget as unknown as Story,
  daGldHalskade as unknown as Story,
  daGldHvordanSerGudUd as unknown as Story,
  daGldMoensKlint as unknown as Story,
  daGldForstarDu as unknown as Story,
];

interface LyricsScreenProps {
  onOpenReader: (story: Story) => void;
}

export function LyricsScreen({ onOpenReader }: LyricsScreenProps) {
  const sorted = [...ALL_LYRICS].sort(
    (a, b) => CEFR_ORDER[a.level] - CEFR_ORDER[b.level]
  );

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Lyrics</h2>
        <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
          {sorted.length} {sorted.length === 1 ? 'song' : 'songs'}
        </span>
      </div>

      <div className="story-list">
        {sorted.map((lyric) => (
          <button
            key={lyric.id}
            className="story-item"
            onClick={() => onOpenReader(lyric)}
          >
            <div className="story-item-info">
              <div className="story-item-title">{lyric.title}</div>
              <div className="story-item-meta">
                <CEFRBadge level={lyric.level} />
                {lyric.metadata?.artist && (
                  <span>♫ {lyric.metadata.artist}</span>
                )}
                <span>{lyric.sentences.length} lines</span>
              </div>
            </div>
            <span className="story-item-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
