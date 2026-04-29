import { useState, useEffect } from 'react';
import { AppContext } from './context/AppContext';
import { Home } from './screens/Home';
import { StoryLibrary } from './screens/StoryLibrary';
import { StoryReader } from './screens/StoryReader';
import { LyricsScreen } from './screens/LyricsScreen';
import { LyricsReader } from './screens/LyricsReader';
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

type Screen = 'home' | 'library' | 'lyrics' | 'saved' | 'settings';

interface ReaderState {
  story: Story;
  back: Screen;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [readerState, setReaderState] = useState<ReaderState | null>(null);
  const [lyricsReaderState, setLyricsReaderState] = useState<ReaderState | null>(null);
  const [savedWords, setSavedWords] = useState<Record<string, SavedWord>>(
    () => loadSavedWords('da')
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings('da'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const handleSaveWord = (word: SavedWord) => {
    saveWord('da', word);
    setSavedWords((prev) => ({ ...prev, [word.word]: word }));
  };

  const handleRemoveWord = (key: string) => {
    removeWordFromStorage('da', key);
    setSavedWords((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleUpdateSettings = (s: AppSettings) => {
    saveSettings('da', s);
    setSettings(s);
  };

  const openReader = (story: Story, back: Screen = screen) => {
    setReaderState({ story, back });
  };

  const closeReader = () => {
    if (readerState) setScreen(readerState.back);
    setReaderState(null);
  };

  const openLyricsReader = (story: Story, back: Screen = screen) => {
    setLyricsReaderState({ story, back });
  };

  const closeLyricsReader = () => {
    if (lyricsReaderState) setScreen(lyricsReaderState.back);
    setLyricsReaderState(null);
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
        ) : lyricsReaderState ? (
          <LyricsReader story={lyricsReaderState.story} onBack={closeLyricsReader} />
        ) : (
          <>
            <div className="screen">
              {screen === 'home' && (
                <Home onNavigate={setScreen} onOpenReader={openReader} />
              )}
              {screen === 'library' && (
                <StoryLibrary
                  onOpenReader={(s) => openReader(s, 'library')}
                />
              )}
              {screen === 'lyrics' && (
                <LyricsScreen onOpenReader={(s) => openLyricsReader(s, 'lyrics')} />
              )}
              {screen === 'saved' && <SavedWords />}
              {screen === 'settings' && <Settings />}
            </div>

            <nav className="nav-bar" aria-label="Main navigation">
              {(
                [
                  { id: 'home', icon: '🏠', label: 'Home' },
                  { id: 'library', icon: '📚', label: 'Stories' },
                  { id: 'lyrics', icon: '🎵', label: 'Lyrics' },
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
