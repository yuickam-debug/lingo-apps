import type { Story } from '@lingo/shared/types';
import { SavedWordsList } from '@lingo/shared/components';
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
