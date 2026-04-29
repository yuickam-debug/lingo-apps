import { createContext, useContext } from 'react';
import type { SavedWord, AppSettings } from '@lingo/shared/types';

interface AppContextType {
  savedWords: Record<string, SavedWord>;
  settings: AppSettings;
  saveWord: (word: SavedWord) => void;
  removeWord: (wordKey: string) => void;
  updateSettings: (settings: AppSettings) => void;
}

export const AppContext = createContext<AppContextType>({} as AppContextType);
export const useApp = () => useContext(AppContext);
