# Evaluation protocol

## Questions

1. Can a musician follow the notation while listening?
2. Can its marks communicate an intended change in sound character?
3. Does including timbre instructions improve a reconstruction relative to the same musical scaffolding with a neutral tone?
4. Where does the notation lose meaningful information, particularly with overlapping sources?

## Two contrasting applications

Choose short excerpts with contrasting instrumentation, texture, or genre. Record title, artist, exact recording/version, stable reference link, excerpt start/end, local input checksum, and rights/access notes. Start around 20–40 seconds if useful, but choose boundaries that make musical sense. Do not commit copyrighted recordings merely because they are publicly streamable.

Use the same legend and meanings for both. If calibration differs, disclose it and do not imply cross-excerpt numerical comparability. Retain a static, readable score for each; an interactive demo alone is not the submission.

## Conditions for comparison

For a short passage in each example, preserve these artifacts:

- A: original recording.
- B: reconstruction with supplied pitch/timing/dynamics scaffolding and a neutral timbre.
- C: reconstruction with the same scaffolding plus the timbre score.
- D: reconstruction after one clearly documented score edit.

Evaluate reconstruction from declared score data and permitted renderer assets. The renderer must not silently access the original recording, separated stems, hidden spectral data, or reference-specific samples to recover details omitted from the score. If an optional sample-based mode does use reference audio, label it as such and evaluate it separately. Replaying stems is not evidence that the notation reconstructs timbre.

Document any renderer parameters that are not visible in the score. A readable projection may omit detail, but the project must explain whether reconstruction comes from the visible notation alone or a richer stored representation.

Compare B and C at comparable playback level with identical scaffolding. Record the level-adjustment method; retain unadjusted files. Keep A as a perceptual reference rather than treating waveform equality as the goal. Where possible, randomize B/C order to reduce expectation effects.

## Musician feedback

Aim for 3–5 volunteers if practical; a smaller sample remains useful but is exploratory. Identify participants anonymously and record relevant musical experience without collecting unnecessary personal data. Report actual counts and disagreements, not broad statistical claims.

Give a brief legend and ask participants to:

1. Follow a score and locate two preselected timbral changes in time.
2. Explain the intended meaning of selected marks in their own words.
3. Listen to B/C without knowing their labels and describe which better preserves the reference's sound character, allowing no preference.
4. Hear D and identify the intended change without being told its direction first.
5. Identify a confusing mark or missing sound quality.
6. Optionally perform one gesture from the score on their instrument and describe what was or was not actionable.

Record prompts, ordering, responses, interpretation, and follow-up revisions. Set success criteria for the chosen tasks before testing; do not retroactively redefine success to fit results. Small-sample disagreement is useful evidence for the reflection.

## Technical checks

- Schema: required fields, finite/ranged values, units, invalid intervals, version handling, stable serialization, and valid silence.
- Renderer: deterministic fixtures where possible; correct duration; finite output; clipping detection; actual score-only inputs; expected timing of edits.
- Editor: save/reload equivalence; undo; lane isolation; synchronized playhead; original versus reconstructed playback labeling; export readability.
- Analysis: pinned input and model provenance; intelligible failures; separation artifacts; consistent mapping; manual corrections retained.
- Musical interpretation: changing one property should have its intended audible direction, while side effects are described. Brightness, noise-like character, attack, pitch, and loudness are not perfectly independent perceptually.

Numerical descriptors can support diagnosis. They cannot establish that a sound is expressive, natural, or perceptually equivalent. Record the relevant listening evidence separately.

## Experiment record template

Copy into `docs/experiments/<date>-<purpose>.md`:

```text
Question / hypothesis:
Commit and environment:
Input identity, excerpt boundaries, and access:
Models/settings/seed and runtime:
Score version and manual interventions:
Compared conditions and level handling:
Expected outcome and criteria set before running:
Actual technical results:
Actual listening observations / anonymous feedback:
Artifact locations:
Limitations and alternative explanations:
Decision and next step:
```

Keep contemporaneous observations so the final reflection describes the student's real design experience rather than a retrospective success narrative.
