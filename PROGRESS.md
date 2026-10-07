# Progress log

Newest entry at the bottom. Claude: read the last entry before starting work,
and add one when you finish.

## 2026-10-06 — Agent setup
- Added CLAUDE.md, PROGRESS.md, `.claude/agents/`, `.claude/commands/`.

## 2026-10-06 — First real status check-in
Moved `_claude-setup/agents` and `_claude-setup/commands` into `.claude/` (first-time
setup), then read through CLAUDE.md, README.md, CONTENT_GUIDE.md, and every file in
`packages/` to see what's actually built vs. the README build plan. No app code changed.

**What works (Weeks 1, 3, 4 — all done):**
- Both apps (`npm run build:de`, `npm run build:da`) compile clean, no TypeScript errors.
- Reader: sentence tap, word tap, tooltip, sentence translation toggle, CEFR badges,
  TTS, saved words persisted to localStorage (`de:saved-words` / `da:saved-words`) — all there.
- Shadowing: `ShadowingPlayer` + `useShadowingPlayer` have play/pause/stop, speed control
  (0.7×/1.0×/1.2×), 3× loop-on-tap with a visible countdown, and the active sentence
  auto-scrolls/highlights in sync with playback.
- Spaced repetition: Leitner 3-box engine (`shared/srs/leitner.ts`) matches the spec exactly
  (daily/3-day/7-day, graduate after 2 correct in box 3). `ReviewSession` + `ClozeCardView`
  pull cloze sentences from real saved-word contexts. The "due today" nudge and box-count
  stats live on the Home screen itself rather than a separate Review Dashboard screen —
  functionally the same, just one screen instead of two.

**Half-done (Week 2 — content pipeline):**
- Both `<NewsDigest>` and `<LyricsReader>` screens are built and working.
- Word-in-context search and frequency badges on saved words are both wired up.
- Content volume is short of the Week 2 target:
  - DELingo has 9 stories (target was 10+).
  - DALingo has 11 stories but the numbering skips 006 and 007 — worth checking whether
    those were intentionally skipped or are just missing.
  - News coverage is patchy for both apps — DALingo has single-article weeks for
    Jan 12, Jan 26, Feb 2, May 18, and Jun 1, then a full 5-article week on Jun 16.
    DELingo has weeks for Apr 14, 20, 21, and May 25. Likely just unfinished content
    batches, not a bug.

**Not started:** nothing — all four weeks have working code behind them. The only
remaining gap is finishing the Week 2 content (more stories, filling out news weeks),
which is authoring work, not coding.
