# CLAUDE.md — lingo-apps (DELingo & DALingo)

Claude Code reads this file automatically at the start of every session.
Keep it short and current.

## Who I am
- Solo, non-technical founder. Explain decisions in plain language.
- I test on a real Android phone via Android Studio.

## What this project is
npm-workspaces monorepo with two comprehensible-input language apps:
- `packages/dalingo` — Danish (stories, lyrics, news)
- `packages/delingo` — German (stories, weekly news digest)
- `packages/shared` (`@lingo/shared`) — components, hooks, Leitner SRS, storage, types,
  content service, used by BOTH apps

Stack: React 19 + Vite 6 + TypeScript, Capacitor 8 for Android,
`@capacitor-community/text-to-speech` for TTS, localStorage for persistence. No backend.

Where things are:
- App screens: `packages/<app>/src/screens/`
- App content JSON: `packages/<app>/src/content/{stories,lyrics,news}/`
- Shared UI: `packages/shared/components/`, logic in `shared/hooks/`, `shared/srs/`, `shared/utils/`
- Content loading: `packages/shared/content/contentService.ts` + `contentAdapter.ts`
- Types: `packages/shared/types/index.ts`

## Source of truth
- Feature spec, screens, SRS rules, design tokens, build plan checklist: `README.md`
- Content JSON format and rules: `CONTENT_GUIDE.md` (follow it exactly)
- Session log: `PROGRESS.md` — read the last entry before starting work

## Rules
1. **Never run scaffolding** (`npm create vite`, `npx cap add android`, `npx cap init`).
   The apps and Android projects already exist; these would overwrite them.
2. Before editing, read the relevant files and tell me your plan. Wait for my OK
   unless I said "go ahead without asking".
3. One feature or bug per task. Don't refactor unrelated code.
4. Shared code goes in `packages/shared`. Only put code in an app package if it is
   app-specific. Changes to `shared` affect BOTH apps — build both to check.
5. Ask before adding any npm package.
6. Never edit files inside `android/` folders by hand unless I ask; `cap sync` manages them.
7. Use the design tokens from README.md; don't invent new colours.
8. Content JSON must follow CONTENT_GUIDE.md. Flag any Danish or German you're unsure
   of with `"needsReview": true` on that sentence rather than guessing.
9. No copyrighted song lyrics in `lyrics/`. Only public-domain songs (traditional,
   pre-1929) or lyrics I supply myself.
10. This is a git repo. Before a big change, tell me to commit (or commit for me if I say so),
    so we can roll back.

## Commands (run from the `lingo-apps/` root)
```bash
npm run build:da      # build DALingo (runs tsc + vite)
npm run build:de      # build DELingo
npm run build         # build both
npm run sync:da       # build DALingo + cap sync → then I press Run in Android Studio
npm run sync:de       # same for DELingo
npm run dev:da        # browser preview of DALingo
```
A task is only done when the relevant build passes with no TypeScript errors.

## When you finish a task
1. Tick the box in the README build plan (if it's on there).
2. Add a short entry to `PROGRESS.md`: date, what changed, files touched,
   what I should test on the phone, anything left unfinished.
3. Tell me in 2–3 plain sentences what to tap to see the change.
