---
description: Write a new Danish story JSON for DALingo
argument-hint: <topic> [level, default A1]
---

Use the `danish-content` agent (it follows CONTENT_GUIDE.md) to write one new Danish story about: $ARGUMENTS

Then:
1. Save it to `packages/dalingo/src/content/stories/` with the next free id (check existing files).
2. Make sure the app's story list picks it up (check how existing stories are loaded/imported).
3. Run `npm run build:da` and fix any type errors.
4. List any sentences marked `"needsReview": true` so I can check them with a native speaker.
