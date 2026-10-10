# Integration verification — 2026-10-10

This record describes observed technical behavior, not listening quality. Worktree evidence is pending the next published checkpoint.

## Reproduction checks

- `npm run fetch-examples`: succeeded for trumpet and Choice. Both downloaded inputs matched the checksums in `data/sources.json`, and FFmpeg prepared the declared excerpts.
- `npm ci --offline`: succeeded from the lockfile, installing 77 packages; audit reported zero vulnerabilities. The first sandboxed attempt failed with a Windows directory permission error; the retry outside the sandbox succeeded. This verifies a fresh dependency installation from the existing package cache, not an uncached machine or Python environment.

## Browser observations

- The local editor opened the Choice draft with four estimated source lanes, including empty other/vocals lanes.
- “Load this study’s reference” loaded `choice.wav` and displayed the 0–20 second alignment. Analyze and Separate controls became enabled.
- Demucs completed through the interface and produced four source lanes. Selecting estimated bass and Estimated source audio reached the explicitly labeled source playback status. This is functional evidence, not a listening assessment.
- PNG export succeeded. Inspected the actual image at `outputs/studies/choice-browser-export-before-texture-fix.png`: time axis, four labels, glyphs and legend render without clipping. Narrow noise-heavy glyphs lose their dots at this scale; this is a visual defect to fix before final export.
- After core fixes, `npm run studies` succeeded: trumpet has four gestures, Choice has 75. Both remain unreviewed suggestions.
- `npm run check` passed lint, syntax, and all 38 tests with loopback access enabled. This includes pitch boundary/sweep tests, score-only rendering, correction round trips, and HTTP job handling.

## Pending

Browser save/reopen verification, narrow-glyph texture correction and final export inspection, remote CI, and actual listening evidence remain pending. A playback control changing state is not evidence that reconstruction sounds correct.
