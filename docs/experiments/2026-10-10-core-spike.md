# Core score-to-sound spike

- Question: can one explicit score drive both visual notation and deterministic audio, while preserving silence and independent events?
- Environment: Windows, Node.js 22.17.0, npm 10.9.2; no runtime packages or models.
- Inputs: `src/examples.mjs`, two original synthetic test compositions, seed 42 and 103. Not assignment excerpts.
- Commands: `npm run check`, `npm run fixtures`.
- Result: all 11 tests pass. Study 1 peak 0.14368 (neutral 0.13876); study 2 peak 0.20260 (neutral 0.32077); all renders report zero limited samples. Scores last 8 seconds.
- Browser evidence: local page loaded successfully; brightness edit 0.1→0.6 updated the score; undo restored 0.1; playback entered Pause state and playhead advanced; status reports score-only synthesis.
- Artifacts: generated JSON, SVG, score WAV, and neutral WAV in `outputs/fixtures/`. CI regenerates these as an artifact.
- Listening observations: not collected. A browser playback action is not evidence of perceptual quality.
- Limitations: main-thread synthesis; sparse notation omits complete pitch/gain/decay information; unequal comparison loudness; no original recording analysis yet. Synthetic examples do not satisfy Part 2.
- Next: improve renderer/UI correctness and comparison behavior, select actual licensed recordings, then implement analysis suggestions and assess separation.
