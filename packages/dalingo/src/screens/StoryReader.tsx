import type { Story } from '@lingo/shared/types';
import { Reader, GrammarSection } from '@lingo/shared/components';
import { useApp } from '../context/AppContext';

interface StoryReaderProps {
  story: Story;
  onBack: () => void;
}

export function StoryReader({ story, onBack }: StoryReaderProps) {
  const { savedWords, saveWord, removeWord } = useApp();
  const grammarPoints = story.metadata?.grammarPoints ?? [];

  return (
    <div className="screen">
      <div className="screen-header">
        <button className="btn-back" onClick={onBack}>‹ Back</button>
        <h2 className="screen-title" style={{ fontSize: '17px' }}>{story.title}</h2>
      </div>

      <Reader
        story={story}
        lang="da"
        savedWords={savedWords}
        onSaveWord={saveWord}
        onRemoveWord={removeWord}
      />

      <GrammarSection points={grammarPoints} />
    </div>
  );
}
