import type { Story, NewsWeek } from '@lingo/shared/types';
import { SavedWordsList } from '@lingo/shared/components';
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

export function SavedWords() {
  const { savedWords, removeWord } = useApp();
  return (
    <SavedWordsList
      savedWords={savedWords}
      removeWord={removeWord}
      allContent={ALL_CONTENT}
    />
  );
}
