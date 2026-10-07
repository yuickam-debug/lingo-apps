---
description: Pick up the next unfinished item from the README build plan and build it
argument-hint: [optional: app name or specific task]
---

Continue building lingo-apps from where it left off.

1. Read the last entry in `PROGRESS.md`, and the "Week-by-week build plan" in `README.md`.
2. Check the actual code to confirm what's really done (the checkboxes may be out of date). If a box is unticked but the feature already works, tick it and move on.
3. Pick the next unfinished task. If I gave a focus, use it: $ARGUMENTS
4. Tell me in plain language:
   - which task you picked and why
   - which files you'll create or change
   - how I'll be able to see it working on my phone
   Then STOP and wait for my OK.
5. After I approve: implement it, then run `npm run build:da` / `npm run build:de` for every app affected (`npm run build` if you touched `packages/shared`). Fix errors until both builds pass.
6. Tick the box in README.md, add an entry to PROGRESS.md, and tell me what to tap to test it.
