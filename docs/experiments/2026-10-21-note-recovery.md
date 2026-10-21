# Missing-note recovery checkpoint — 2026-10-21

## Trigger and acceptance criteria

The student reported that both X/Y reconstructions sounded poor and retained perhaps one sixth of the audible notes. This is a qualitative listening estimate, not a measured recall score. X/Y share scaffolding, so timbre preference cannot diagnose missing pitches or entrances.

Before changing the analyzer, added a continuous seven-note semitone melody with constant amplitude. Acceptance: exactly seven events, each pitch within 0.3 semitones and onset within 55 ms; a two-second note with 0.3-semitone vibrato must remain one event. These criteria check both missed notes and invented attacks.

## Evidence and change

The previous analyzer failed both tests: seven notes collapsed to two events, and a sustained note became two. Adjacent-frame pitch differences missed gradual transitions and transitions with unvoiced frames; the mandatory 1.5-second split invented an attack.

v3 compares three consistent upcoming pitch estimates with the current note anchor. It detects semitone changes despite intervening uncertain frames and removes the arbitrary duration split. The pitch estimator itself is unchanged. Settings are recorded in score provenance. Both new regressions and all nine existing analyzer tests pass.

Regenerated drafts contain 13 trumpet events (previously 4) and 103 Choice events (previously 75). These counts are NOT ground-truth note recall. No manual correction was applied. Repeated same-pitch attacks, overlapping notes within a stem, uncertain pitches, and precise onset alignment remain to be assessed. This is still monophonic extraction per lane, not polyphonic transcription.

## Reproduction and listening

Run `node --test test/melody.test.mjs test/analysis.test.mjs`, then `npm run studies` and `node scripts/build-review.mjs` with the previously prepared reference files and Demucs stems.

Previous scores and matched recordings are preserved locally in `outputs/baseline-v2-note-loss/`. New recordings are in `outputs/studies/` and embedded in `outputs/review/review-A.html` and `review-B.html`. Original sources, trimming, and separation remain unchanged. These output folders are ignored by Git.

No agent listening judgment is claimed. The student should compare source and reconstruction phrase by phrase before resuming timbre preference evaluation. The workflow's perceptual gate remains open.

Full verification: npm run check passed lint, syntax checks, and 44/44 tests with local network access. The initial restricted run passed 43/44; its HTTP test failed to fetch localhost. Static exports were regenerated but this checkpoint does not claim visual or listening approval.

## Repeated-note follow-up

A five-note same-pitch fixture with brief articulation dips collapsed to one event under v3. Added a 23 ms energy window alongside the existing pitch window, detecting a local dip followed by renewed energy. v3.1 retains all five attacks within 55 ms and correct pitch; sustained bass and gently modulated notes at 32.7, 55, 110, and 440 Hz remain single events. All four melody regressions pass. This does not establish robustness for arbitrary tremolo, very rapid notes, or polyphony.

Regenerated v3.1 output: 13 trumpet and 106 Choice events. `node scripts/build-note-review.mjs` creates an embedded-audio source / old / revised diagnostic page at `outputs/review/note-recovery.html`. It uses the preserved v2 baseline and fails if that baseline is absent. This unblinded comparison is separate from the randomized timbre preference task. Human listening remains pending.

Follow-up full verification: lint, syntax checks and 46/46 tests passed with localhost access.

## Real-recording diagnostic, after continuing listener rejection

`node scripts/diagnose-notes.mjs` compares centered 2048-sample frames at a 256-sample hop with saved score events. The full trace is written to ignored `outputs/diagnostics/note-coverage.json`. This deliberately uses the same pitch estimator: it diagnoses information discarded by segmentation, not ground-truth accuracy or independent note recall.

Trumpet: 20 of 206 active pitched frames differ from the score by more than 0.7 semitones or lack a score pitch. Around 1.44–1.52 seconds, frame estimates move from roughly 70.6 to 69.9 while the current score already holds 67.9. This suggests premature boundary placement and merging of an intervening pitch. A centered diagnostic also exposes the known forward-window timestamp bias.

Choice bass: 129 of 701 active pitched frames differ or have no score pitch. At 0.906–1.022 seconds the estimate is consistently about MIDI 33.1, but the corresponding score has null pitch. The per-event 45% voiced-frame requirement can erase short pitched regions inside longer uncertain segments, turning them into a noise carrier. Inspect voiced/unvoiced segmentation and event pitch assignment before changing timbre synthesis.

Choice drums: no confident pitched frames in this diagnostic. This says nothing about missing percussion attacks or multiple drum types; this pitch-only diagnostic cannot evaluate those.

Next implementation targets: preserve short voiced regions within uncertain bass segments, correct timestamp/boundary handling, and verify the trumpet transition without indiscriminately increasing event count. Add appropriate regressions and compare real traces before regenerating the listener materials. No new musical fix or listening success is claimed in this diagnostic checkpoint.
