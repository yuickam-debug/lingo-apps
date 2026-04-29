import type { CEFRLevel } from '../types';

interface Props {
  level: CEFRLevel;
}

export function CEFRBadge({ level }: Props) {
  return <span className={`cefr-badge ${level}`}>{level}</span>;
}
