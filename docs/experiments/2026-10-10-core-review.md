# Independent core correctness review — 2026-10-10

Question: Can the current pitch estimator and score renderer preserve basic musical scaffolding at their advertised boundaries, and do the applied drafts actually render using only declared score data?

Environment: shared `feat/m1-playable-score` working checkout, Windows, Node test runner. No new dependencies, downloads, model runs, or listening claims for this review. The reviewed files were `src/analysis.mjs`, `src/score.mjs`, `src/synth.mjs`, `src/comparison.mjs`, and both applied draft JSON files. Core source changes are owned by the parent agent.

Method: independent deterministic sine fixtures with analytically known pitch, a shortest-valid envelope fixture, a deliberately insufficient output sample rate, provenance mutation, and checks of the actual saved drafts. Expected outcomes were specified in tests before fixes.

## Initial actionable findings

`node --test test/core-review.test.mjs`: 7 tests, 2 passed, 5 failed on the initial reviewed implementation.

1. A pure 1200 Hz sine (MIDI86.3695) produced MIDI74.4199, approximately an octave low. It lies below the estimator's nominal 1400 Hz upper search bound. Coarse decimated correlation peaks can prefer a multiple of the true period.
2. A pure 6000 Hz sine produced MIDI70.7827, an invented low pitch within the accepted score range. Selecting every fourth sample without anti-alias filtering folds upper frequencies down. High-frequency tones outside the supported pitch range should not be confidently converted into a lower note.
3. The exact MIDI24/C1 sinusoid (32.70319566 Hz) produced null. MIDI25 and MIDI26 fixtures were accurate; this points to a numerical/range boundary rather than a general low-bass failure. Under the existing analyzer mapping, null is subsequently rendered as noise, making this boundary consequential.
4. A valid 4 ms gesture with attack and release of 2 ms each becomes invalid under `neutralScore`: each envelope time is changed to 1 ms, below the schema minimum. Neutral comparison must remain a valid score for every valid source score.
5. The renderer accepts 8000 Hz output with a MIDI108 pitched event, but the fundamental (about4186 Hz) exceeds Nyquist and the harmonic count becomes zero. With noise set to zero the note silently disappears. Explicit rejection is preferable to claiming a successful rendering of an unsupported combination.

These failures were sent to the parent agent before changing core code. `test/core-review.test.mjs` contains the executable regressions. This report's initial results should remain as evidence even after fixes; append subsequent verification rather than replacing the observations.

## Passing evidence

- Changing provenance to nonexistent original/stem audio paths and different hidden metadata yields exactly identical rendered samples. Code inspection also finds no file access in the renderer. This supports the limited technical claim that this renderer uses declared score events, not original or separated audio. It does not establish perceptual fidelity or that the printed notation displays every stored parameter.
- Both `examples/trumpet.json` and `examples/choice.json` pass schema validation and render with no limiter activation. Their durations are5.333379 and20 seconds, respectively.
- Trumpet initially contains9 pitched events. Choice contains47 drum events,28 bass events (19 pitched), and two empty estimated lanes (`other`, `vocals`). All four source groups remain represented. Empty lanes do not prove absent instruments, and populated lanes do not prove identified instruments.
- The saved Choice separation report includes the htdemucs model/settings, weight hash, input hash, package versions and an explicit listening-review-pending status.

## Interpretation limits, not newly asserted perceptual findings

A synthetic tone starting exactly at1.000 seconds yielded a gesture starting at0.928798 with an approximately69.66 ms attack. The descriptor frames look forward over2048 samples (about92.9 ms); the gesture start therefore need not equal the physical onset. The attack partially expresses that uncertainty, but claims of exact event alignment would be misleading. Treat this as current temporal resolution and inspect alignment while listening.

Null pitch currently implies pure-noise synthesis. This is an explicit schema/renderer restriction, not evidence that unidentified or polyphonic source audio sounds like noise. Some failures of the reconstruction will follow from this representational choice even after the pitch estimator improves.

Comparison level matching uses numerical RMS, not perceived loudness. No human listening, participant feedback, instrument-identification accuracy, or reconstruction quality was established here.

## Fixes and verification

The parent agent subsequently authorized changes to the three core modules. All five initial regressions are now fixed:

- `spectral-gesture-v2` replaces unfiltered decimated autocorrelation with a full-rate YIN-style cumulative normalized difference estimator. It selects the first sufficiently periodic local minimum and interpolates its raw difference minimum. An isolated narrow spectral peak above the supported band is rejected instead of accepting a later multiple-period minimum. No sample decimation remains. The algorithm family is described by [de Cheveigne and Kawahara, 2002](https://doi.org/10.1121/1.1458024); this small implementation is not a claim to reproduce every step or performance result of that paper.
- Pitch provenance records the MIDI24–108 range,0.12 periodicity threshold, and0.15-semitone numerical boundary allowance. This tolerance permits boundary estimates to clamp to the allowed endpoints. It is an estimator allowance, not a perceptual accuracy guarantee.
- Neutral attack/release durations respect the2 ms minimum even for a4 ms event.
- The renderer explicitly rejects a pitch above its0.45-times-sample-rate tonal cutoff instead of silently producing a missing fundamental. Existing harmonic rolloff remains bounded below Nyquist.
- Analyzer provenance now explicitly explains the unknown-pitch/noise-carrier mapping and forward-window timing limitation.

Verification command: `node --test test/analysis.test.mjs test/core-review.test.mjs test/core.test.mjs test/comparison.test.mjs`.

Actual result:31 tests passed,0 failed. The five original regression tests all pass. Added targeted tests sweep every integer MIDI pitch from24 through108 at two phases, check stronger second/third harmonics and missing-fundamental signals at55/110/440/1200 Hz, and reject isolated out-of-band tones and DC. Across the170 pure-tone sweep cases, maximum observed error was0.04651 semitone. These are deterministic signal fixtures, not a representative accuracy benchmark for recordings or polyphonic music.

Practical runtime check in the same Windows/Node process used the existing local raw WAVs and did not write new applied scores:

| Input | Audio duration | Analysis wall time | Suggested events |
| --- | ---: | ---: | ---: |
| Trumpet mixture |5.33338 s |0.10544 s |4 |
| Choice mixture |20 s |0.66480 s |42 |

These timings exclude file decoding, separation, and rendering; the process had already run the pitch sweep, so they are warm-process observations. No standalone browser timing or low-powered hardware benchmark was performed. The applied study regeneration is owned by the parent agent, because changed estimates materially change saved scores. Human listening and notation alignment review remain pending.
