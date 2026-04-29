import { useState, useCallback } from 'react';

export function useSentenceTranslation() {
  const [shownId, setShownId] = useState<string | null>(null);

  const toggleTranslation = useCallback((id: string) => {
    setShownId((prev) => (prev === id ? null : id));
  }, []);

  const isShown = useCallback((id: string) => shownId === id, [shownId]);

  const hideTranslation = useCallback(() => setShownId(null), []);

  return { toggleTranslation, isShown, hideTranslation };
}
