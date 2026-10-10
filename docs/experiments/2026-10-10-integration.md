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

## Review packet and publication

- Published checkpoint `a2646b8be5b72cac381f9531d04aad90818a2d87`; verified the remote branch hash. GitHub push and PR checks both completed successfully (runs 38064982378 and 38064985008).
- Built `outputs/review/` with offline HTML pages, both SVG scores and complete-value tables, score JSON, level-matched reference/neutral/score/edited WAVs, reversed X/Y order pages, facilitator key, and response sheet. Every WAV decodes; Choice is 20 seconds, trumpet approximately 5.3334 seconds (render duration differs from the reference by one sample).
- Visually inspected both regenerated SVGs in the browser. Narrow drum glyphs now retain dots, rounding seams no longer create spurious bass subrows, and the long trumpet layer name wraps inside its gutter. Both timelines and legends are visible.
- The review page displays both applications, source attribution, and all ten audio controls. No listener responses or perceptual conclusions have been collected.

The final label-wrapping update passed all 42 checks, lint and syntax. Browser save/reopen verification and actual listening evidence remain pending. A playback control changing state is not evidence that reconstruction sounds correct.
