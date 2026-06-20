import { useState, useEffect } from 'react';
import type { Story, CEFRLevel } from '@lingo/shared/types';
import { CEFRBadge } from '@lingo/shared/components';
import { applyTranslationOverlay } from '@lingo/shared/content/contentService';

import daLyrics001 from '../content/lyrics/da-lyrics-001.json';
import daGldDetKunVigtigt from '../content/lyrics/da-gld-det-kun-vigtigt.json';
import daGldVilDuNoget from '../content/lyrics/da-gld-vil-du-noget.json';
import daGldHalskade from '../content/lyrics/da-gld-halskade.json';
import daGldHvordanSerGudUd from '../content/lyrics/da-gld-hvordan-ser-gud-ud.json';
import daGldMoensKlint from '../content/lyrics/da-gld-moens-klint.json';
import daGldForstarDu from '../content/lyrics/da-gld-forstar-du.json';

const CEFR_ORDER: Record<CEFRLevel, number> = { A1: 0, A2: 1, B1: 2, B2: 3 };

const BUNDLE_URL =
  'https://raw.githubusercontent.com/yuickam-debug/lingo-apps/main/packages/dalingo/src/content/lyrics/da-lyrics-bundle.json';
const CACHE_KEY = 'lingo_lyrics_da_v2';
const CACHE_TS_KEY = 'lingo_lyrics_da_v2_ts';
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

const BUNDLED: Story[] = [
  daLyrics001 as unknown as Story,
  daGldDetKunVigtigt as unknown as Story,
  daGldVilDuNoget as unknown as Story,
  daGldHalskade as unknown as Story,
  daGldHvordanSerGudUd as unknown as Story,
  daGldMoensKlint as unknown as Story,
  daGldForstarDu as unknown as Story,
];

function mergeLyrics(base: Story[], remote: Story[]): Story[] {
  const map = new Map<string, Story>();
  for (const s of base) map.set(s.id, s);
  for (const s of remote) map.set(s.id, s); // remote wins
  return [...map.values()].sort(
    (a, b) => CEFR_ORDER[a.level] - CEFR_ORDER[b.level],
  );
}

function readCache(): { lyrics: Story[]; fresh: boolean } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const ts = localStorage.getItem(CACHE_TS_KEY);
    if (!raw || !ts) return null;
    return { lyrics: JSON.parse(raw) as Story[], fresh: Date.now() - Number(ts) < CACHE_TTL };
  } catch {
    return null;
  }
}

function writeCache(lyrics: Story[]): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(lyrics));
    localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  } catch {}
}

function getInitialLyrics(): Story[] {
  const cached = readCache();
  // Always apply translation overlay to BUNDLED so individual files with
  // translations embedded take precedence over any stale cached data.
  const withOverlay = BUNDLED.map(applyTranslationOverlay);
  return cached ? mergeLyrics(withOverlay, cached.lyrics) : withOverlay;
}

type SyncStatus = 'idle' | 'fetching' | 'synced' | 'cached' | 'error';

interface LyricsScreenProps {
  onOpenReader: (story: Story) => void;
}

export function LyricsScreen({ onOpenReader }: LyricsScreenProps) {
  const [lyrics, setLyrics] = useState<Story[]>(getInitialLyrics);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [syncedAt, setSyncedAt] = useState<number | null>(null);

  useEffect(() => {
    const cached = readCache();
    if (cached?.fresh) {
      setSyncStatus('cached');
      setSyncedAt(Number(localStorage.getItem(CACHE_TS_KEY)));
      return;
    }

    setSyncStatus('fetching');

    fetch(BUNDLE_URL)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then((bundle: { lyrics: Story[] } | null) => {
        if (!bundle?.lyrics?.length) { setSyncStatus('error'); return; }
        const withOverlay = bundle.lyrics.map(applyTranslationOverlay);
        writeCache(withOverlay);
        setLyrics(mergeLyrics(BUNDLED.map(applyTranslationOverlay), withOverlay));
        setSyncStatus('synced');
        setSyncedAt(Date.now());
      })
      .catch(() => setSyncStatus('error'));
  }, []);

  return (
    <div>
      <div className="screen-header">
        <h2 className="screen-title">Lyrics</h2>
        <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>
          {lyrics.length} {lyrics.length === 1 ? 'sang' : 'sange'}
        </span>
      </div>

      {syncStatus !== 'idle' && (
        <div style={{ padding: '0 20px 8px', fontSize: '11px', color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: '5px' }}>
          {syncStatus === 'fetching' && <><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', opacity: 0.6, animation: 'reviewPulse 1s ease-in-out infinite' }} />Opdaterer…</>}
          {syncStatus === 'synced' && <><span style={{ color: 'var(--accent)' }}>✓</span> Opdateret {syncedAt ? new Date(syncedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ''}</>}
          {syncStatus === 'cached' && <><span>↺</span> Cache {syncedAt ? new Date(syncedAt).toLocaleTimeString('da-DK', { hour: '2-digit', minute: '2-digit' }) : ''}</>}
          {syncStatus === 'error' && <><span style={{ color: '#E53E3E' }}>✕</span> Opdatering mislykkedes — offline indhold vises</>}
        </div>
      )}

      <div className="story-list">
        {lyrics.map((lyric) => (
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
                <span>{lyric.sentences.length} linjer</span>
              </div>
            </div>
            <span className="story-item-arrow">›</span>
          </button>
        ))}
      </div>
    </div>
  );
}
