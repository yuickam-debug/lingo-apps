import { useState, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import { Home } from './screens/Home';
import { StoryLibrary } from './screens/StoryLibrary';
import { StoryReader } from './screens/StoryReader';
import { NewsDigest } from './screens/NewsDigest';
import { SavedWords } from './screens/SavedWords';
import { Settings } from './screens/Settings';
import type { Story, SavedWord, AppSettings } from '@lingo/shared/types';
import {
  loadSavedWords,
  saveWord,
  removeWord as removeWordFromStorage,
  loadSettings,
  saveSettings,
} from '@lingo/shared/storage';

type Screen = 'home' | 'library' | 'news' | 'saved' | 'settings';

interface ReaderState {
  story: Story;
  back: Screen;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [readerState, setReaderState] = useState<ReaderState | null>(null);
  const [savedWords, setSavedWords] = useState<Record<string, SavedWord>>(
    () => loadSavedWords('de')
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings('de'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleSaveWord = (word: SavedWord) => {
    saveWord('de', word);
    setSavedWords((prev) => ({ ...prev, [word.word]: word }));
  };

  const handleRemoveWord = (key: string) => {
    removeWordFromStorage('de', key);
    setSavedWords((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUpdateSettings = (s: AppSettings) => {
    saveSettings('de', s);
    setSettings(s);
  };

  const openReader = (story: Story, back: Screen = screen) => {
    setReaderState({ story, back });
  };

  const closeReader = () => {
    if (readerState) setScreen(readerState.back);
    setReaderState(null);
  };

  return (
    <AppContext.Provider
      value={{
        savedWords,
        settings,
        saveWord: handleSaveWord,
        removeWord: handleRemoveWord,
        updateSettings: handleUpdateSettings,
      }}
    >
      <div className="app">
        {readerState ? (
          <StoryReader story={readerState.story} onBack={closeReader} />
        ) : (
          <>
            <div className="screen">
              {screen === 'home' && (
                <Home onNavigate={setScreen} onOpenReader={openReader} />
              )}
              {screen === 'library' && (
                <StoryLibrary onOpenReader={(s) => openReader(s, 'library')} />
              )}
              {screen === 'news' && (
                <NewsDigest onOpenReader={(s) => openReader(s, 'news')} />
              )}
              {screen === 'saved' && <SavedWords />}
              {screen === 'settings' && <Settings />}
            </div>

            <nav className="nav-bar" aria-label="Main navigation">
              {(
                [
                  { id: 'home', icon: '🏠', label: 'Home' },
                  { id: 'library', icon: '📚', label: 'Stories' },
                  { id: 'news', icon: '📰', label: 'News' },
                  { id: 'saved', icon: '⭐', label: 'Saved' },
                  { id: 'settings', icon: '⚙️', label: 'Settings' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  className={`nav-item${screen === item.id ? ' active' : ''}`}
                  onClick={() => setScreen(item.id)}
                  aria-current={screen === item.id ? 'page' : undefined}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </nav>
          </>
        )}
      </div>
    </AppContext.Provider>
  );
}
