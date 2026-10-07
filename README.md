# DELingo & DALingo

Two CI-based language learning apps built on comprehensible input methodology.

- **DELingo** — German · Stories + Weekly News Digest
- **DALingo** — Danish · Stories + Lyrics

## Architecture

```
lingo-apps/
├── packages/
│   ├── shared/                  # Shared across both apps
│   │   ├── components/          # Reader, ShadowingPlayer, ClozeCard, etc.
│   │   ├── srs/
│   │   │   └── leitner.ts       # Leitner 3-box SRS engine
│   │   ├── storage/
│   │   │   └── index.ts         # localStorage wrapper, typed keys
│   │   └── types/
│   │       └── index.ts         # All TypeScript interfaces
│   │
│   ├── delingo/                 # German app
│   │   ├── content/
│   │   │   ├── stories/         # Story JSONs (sentence-segmented, CEFR-tagged)
│   │   │   └── news/            # Weekly news digest JSONs
│   │   └── screens/             # App-specific screens (NewsDigest, etc.)
│   │
│   └── dalingo/                 # Danish app
│       ├── content/
│       │   ├── stories/         # Story JSONs
│       │   └── lyrics/          # Lyrics JSONs (line-by-line)
│       └── screens/             # App-specific screens (LyricsReader, etc.)
│
└── package.json                 # Monorepo root
```

## Content JSON Format

Every piece of content (story, news article, lyric) uses the same `Story` type:

```json
{
  "id": "de-story-001",
  "title": "Der erste Tag",
  "level": "A1",
  "genre": "narrative",
  "source": "story",
  "sentences": [
    {
      "id": "de-001-s01",
      "text": "Heute ist mein erster Tag in Berlin.",
      "translation": "Today is my first day in Berlin.",
      "words": [
        {
          "word": "erster",
          "definition": "first",
          "partOfSpeech": "adj.",
          "grammar": "erst- + -er (masc. nom. ending)"
        }
      ]
    }
  ]
}
```

News articles add `metadata.publishedDate` and `metadata.topic`.
Lyrics add `metadata.artist`.

This single format drives:
- **Reader** — renders sentences, highlights tappable words
- **Sentence translation** — uses `sentence.translation`
- **Shadowing** — iterates sentences with TTS timing
- **Cloze cards** — blanks a saved word in its original sentence
- **Context lookup** — searches all content for sentences containing a word

## Screen Flow

### Shared screens (both apps)
1. **Home** — Review nudge (if words due), stats row, content preview
2. **Story Library** — CEFR-sorted list, genre tags, tap to open reader
3. **Story Reader** — Sentence-tap translation, word-tap definition, audio, shadowing CTA
4. **Saved Words** — Frequency badges, tap to expand context card
5. **Shadowing Player** — Speed control, sentence highlight, 3× loop, play/pause/skip
6. **Review Dashboard** — Due count, Leitner box visualization, start button
7. **Cloze Review Card** — Progress bar, blanked sentence, reveal, correct/incorrect
8. **Settings** — Dark mode toggle, TTS voice, shadowing pause, reset

### DELingo-only
- **News Digest** — Weekly list (5 articles), topic tags, "New" badges, archive
- **News Article Reader** — Same UX as story reader, with topic/date header

### DALingo-only
- **Lyrics Reader** — Line-by-line, italic styling, same tap UX as stories

## SRS Algorithm (Leitner 3-Box)

| Box | Review Interval | On Correct | On Incorrect |
|-----|----------------|------------|--------------|
| 1   | Daily          | → Box 2   | Stay Box 1   |
| 2   | Every 3 days   | → Box 3   | → Box 1      |
| 3   | Every 7 days   | Count +1  | → Box 1      |

Graduate after 2 correct answers in Box 3. Graduated words leave the review queue.

## Getting Started

### Prerequisites
- Node.js 18+
- VS Code (recommended extensions: ESLint, Prettier, TypeScript)

### Setup
```bash
# Clone and install
git clone <repo-url> lingo-apps
cd lingo-apps

# For DELingo
cd packages/delingo
npm create vite@latest . -- --template react-ts
npm install
npm run dev

# For DALingo (separate terminal)
cd packages/dalingo
npm create vite@latest . -- --template react-ts
npm install
npm run dev
```

### Week-by-week build plan

**Week 1 — Enrich the Reading Core**
- [x] Set up Vite + React + TypeScript for both apps
- [x] Build `<Reader>` component (sentence tap, word tap, tooltip)
- [x] Add sentence-level translation toggle (<200ms)
- [x] Add CEFR badges + sort story list by level
- [x] Add TTS via `window.speechSynthesis`
- [x] Wire saved words to localStorage (persist across restarts)

**Week 2 — Content Pipeline & Contextual Vocabulary**
- [ ] Author 10+ stories per language in JSON format (DALingo has 11; DELingo has 9 — one short, and DALingo is missing stories 006/007)
- [x] Author 5 news articles for DELingo week 1
- [x] Build `<NewsDigest>` screen (DELingo) — built for both apps
- [x] Build `<LyricsReader>` screen (DALingo)
- [x] Build word-in-context cards (query all content for matching sentences)
- [x] Add frequency badges to saved words

**Week 3 — Shadowing Mode**
- [x] Build `<ShadowingPlayer>` with sentence-level TTS
- [x] Add speed control (0.7×, 1.0×, 1.2×)
- [x] Add 3× loop on sentence tap with visible counter
- [x] Sentence highlighting synced to audio playback

**Week 4 — Spaced Repetition**
- [x] Integrate Leitner engine (already scaffolded in `shared/srs/`)
- [x] Build `<ReviewDashboard>` with box visualization — merged into the Home screen rather than a separate screen
- [x] Build `<ClozeCard>` pulling real sentences from content
- [x] Add daily review nudge on home screen
- [x] Real-time stat updates during review session

## Design Tokens

| Token | Light | Dark |
|-------|-------|------|
| Background | `#FAFAF7` | `#1c1c1a` |
| Card | `#FFFFFF` | `#2a2a28` |
| Ink (primary) | `#2C2C2A` | `#e0ded6` |
| Ink (secondary) | `#73726c` | `#9c9a92` |
| DELingo accent | `#1D9E75` | `#9FE1CB` |
| DALingo accent | `#378ADD` | `#85B7EB` |
| Warm (highlights) | `#EF9F27` | `#FAC775` |

Default theme: **light**. Dark mode available via Settings toggle.

very subsequent update:


# from lingo-apps/ root
npm run build --workspace=packages/dalingo
cd packages/dalingo && npx cap sync
# then build/run from Android Studio

# from lingo-apps/ root
npm run build --workspace=packages/delingo
cd packages/delingo && npx cap sync
# then build/run from Android Studio