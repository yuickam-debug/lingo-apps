import { useState } from 'react';
import type { GrammarPoint } from '../types';

interface GrammarCardProps {
  point: GrammarPoint;
  index: number;
}

function GrammarCard({ point, index }: GrammarCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="grammar-card" onClick={() => setOpen((o) => !o)}>
      <div className="grammar-card-header">
        <span className="grammar-index">{index + 1}</span>
        <span className="grammar-rule">{point.rule}</span>
        <span className="grammar-chevron">{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div className="grammar-card-body">
          <p className="grammar-example">"{point.exampleSentence}"</p>
          <p className="grammar-explanation">{point.explanation}</p>
        </div>
      )}
    </div>
  );
}

interface GrammarSectionProps {
  points: GrammarPoint[];
}

export function GrammarSection({ points }: GrammarSectionProps) {
  if (points.length === 0) return null;

  return (
    <div className="grammar-section">
      <p className="section-header" style={{ paddingTop: 16 }}>
        Grammar Notes
      </p>
      <div className="grammar-list">
        {points.map((p, i) => (
          <GrammarCard key={i} point={p} index={i} />
        ))}
      </div>
    </div>
  );
}
