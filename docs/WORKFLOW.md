# Development workflow

## Outcome and priorities

Build an editable, playable timbre score that is useful for listening, communicating musical gestures, and experimenting with sound. Software sophistication supports that purpose; it does not replace the two applied scores or musical reflection.

The submission deadline is October 25, 2026. The user requests continuous rapid implementation and explicitly does not want work stretched to that date. The original 16-day windows below are an initial ordering estimate, not waiting periods or a prescribed pace. Complete milestones as soon as their evidence gates pass, leaving as much time as possible for feedback and submission. Milestone gates are evidence requirements, not claims that all work will fit the estimate.

## Incremental Git workflow

The initial documentation bootstrap may be pushed directly to the repository's default branch. After bootstrap:

1. Start from the latest default branch and create `feat/<milestone>-<purpose>`, `fix/<purpose>`, or `docs/<purpose>`.
2. Write a small work item with purpose, musician-facing behavior, scope, acceptance criteria, and validation plan. Use a GitHub issue when available; otherwise record it in `docs/PROGRESS.md`.
3. Implement one reviewable behavior at a time. Prefer a complete small path from input to output over disconnected subsystems.
4. Run the checks appropriate to the behavior. Inspect the score visually and listen when sound changes. Record actual commands, outcomes, and remaining limitations.
5. Commit a coherent increment, then push the branch. Push after a verified behavior, a completed experiment with recorded findings, or a useful end-of-session checkpoint; do not wait until the project is finished. Label incomplete checkpoints honestly and keep them off the default branch.
6. Open or update a draft pull request early. Summarize the current result rather than a chronological diary. Include evidence and known limitations.
7. Review the diff, tests, musical evidence, licensing/source records, and score readability. Automated review can assist; a listening claim requires an actual listening observation. Where possible, ask a musician to assess the interpretation.
8. Merge only when the relevant acceptance criteria pass and required checks are green. Then update the progress ledger. If PR tooling is unavailable, push the branch and provide a comparison link; do not silently bypass review.
9. At a milestone gate, record the exact commit and create an annotated `v0.x.0` tag after validation. Explicitly push the tag. Tags identify reproducible demonstrations, not arbitrary dates.

Suggested commit examples: `feat(score): encode brightness gestures`, `test(render): verify score-controlled attack`, `docs(evaluation): record first listening comparison`.

Never force-push the default branch. Preserve unrelated work. Resolve failed checks before merging, or explicitly narrow the milestone and document what was deferred. A local commit is not a published result: verify the remote branch points to the intended commit after each push.

## Milestone plan

| Window | Milestone and reviewable result | Gate before merging/tagging |
| --- | --- | --- |
| Day 1 | M0: establish requirements; select two contrasting excerpts; document original-source links, timing, intended use, and access; interview or arrange feedback from a musician | Both examples are available for analysis; contrast is musically meaningful; acceptance criteria and listening procedure agreed |
| Days 2–3 | M1: invent the notation; hand-author a score fragment for each excerpt; implement versioned score data and static rendering | A reader can follow time, overlapping layers, silence, and the legend; schema validation and save/load round trips pass; unresolved symbols are documented |
| Days 4–5 | M2: build a deterministic basic renderer using explicitly supplied musical scaffolding | The saved score renders without reading the original recording; edits have audible, intended effects; no clipping/invalid samples; baseline comparison retained |
| Days 6–8 | M3: analyze audio and optionally separate layers; generate editable score suggestions | A fixed excerpt produces reproducible suggestions with model/settings provenance; failures and artifacts are visible; original versus separated listening comparison recorded |
| Days 9–10 | M4: integrate editor, synchronized playback, undo, and export | Import → inspect → edit → save → reopen → render works; audio and score alignment checked; original/reconstruction/edited comparison and static export work |
| Days 11–12 | M5: apply the system completely to both contrasting excerpts | Same notation semantics across excerpts; corrections and ambiguous passages logged; both scores and reconstructions complete; no cherry-picking away difficult passages without disclosure |
| Days 13–14 | M6: evaluate with listeners; refine the notation; run reconstruction experiments | Evidence includes notation comprehension, intentional-edit recognition, and comparison against a neutral-timbre baseline; failures lead to fixes or explicit limitations |
| Days 15–16 | M7: freeze features; complete reproducibility check, demonstration, exports, and reflection | Clean setup tested; final audio/visual artifacts verified; links and excerpt boundaries checked; essay reflects actual work; final release tagged |

These can overlap, but M2 precedes dependence on sophisticated extraction: prove the score can drive sound before asking a model to write that score. Do not postpone instrument separation indefinitely; its intended M3 evaluation determines whether it improves the final application.

## Required engineering practices

- At M1, select the stack through a small technical spike, then record the choice and add a lockfile, installation instructions, and one documented check command.
- Add CI with the first executable implementation. Required jobs: relevant lint/type checks, unit tests, and a tiny deterministic end-to-end fixture. Keep routine CI CPU-capable; expensive model tests run separately with recorded results.
- Test semantic behavior: timing, units, boundaries, silence, overlapping events, serialization, unsupported schema versions, invalid input, and controlled rendering changes. Avoid tests that merely repeat implementation details.
- Use generated or appropriately licensed tiny fixtures in Git. Keep private/full recordings, downloaded models, large renders, credentials, and caches out of Git. Store permitted release media as release assets or a documented external artifact location.
- Pin dependencies and record model identities/revisions, settings, seeds where relevant, hardware, and runtime for analysis runs. Do not claim reproducibility when model or input access prevents it.
- Every sound-changing PR includes an audible example or a precise reproducible local artifact reference plus listening notes. Every notation-changing PR includes before/after score images and explains the musician-facing meaning.
- Never present an automated spectral check as proof of perceptual quality. Never invent participant feedback, listening observations, or essay experiences.

## Decision checkpoints and scope control

At M1, decide what a symbol means before choosing how a feature estimates it. At M2, decide whether the rendering interpretation is musically useful. At M3, compare separation-assisted and mixture-based notation and choose the better supported approach for each example, clearly labeling the difference.

If analysis is weak, retain manual correction and report its extent. If instrument identification fails, allow descriptive source labels. If polyphonic transcription is weak, use documented hand-entered scaffolding or an appropriately licensed MIDI source. If reconstruction is approximate, retain it as evidence of the notation's limits. None of these substitutions may be presented as automatic recovery.

Do not simplify solely because implementation is substantial. Simplify when evidence shows a subsystem is preventing a valid musical demonstration. Keep a stretch backlog for cross-instrument rendering, richer timbre dimensions, and ensemble blend editing after the core gates pass.

## Definition of done for each increment

- Behavior and musical purpose are clear.
- Relevant checks pass, with actual results recorded.
- Any changed audio and visuals have been inspected appropriately.
- Limitations, manual interventions, and dependencies are disclosed.
- The branch is pushed and its remote commit verified.
- Progress ledger and PR describe the current reviewable state.
