# Progress ledger

## Current state

- Repository initialized with planning documents on 2026-10-10.
- First score/editor/renderer prototype implemented on `feat/m1-playable-score`; 11 core tests pass and browser edit/undo/playback checks pass.
- No human listening evaluation or assignment transcriptions completed yet. Synthetic studies are fixtures only.
- Next: recording selection, analysis, comparison controls, and remaining editor validation.
- Submission date: October 25, 2026. User explicitly requests continuous rapid work, not a pace stretched to the deadline. Finish as early as evidence permits.

## Milestone status

| Milestone | Status | Evidence / PR / release |
| --- | --- | --- |
| Workflow bootstrap | Published | `010a115` |
| M0: requirements and excerpts | Not started | — |
| M1: notation and score contract | In progress; synthetic examples and validated contract | `docs/decisions/0001-core-spike.md` |
| M2: score-driven renderer | Implemented first approximation; listening gate pending | `docs/experiments/2026-10-10-core-spike.md` |
| M3: analysis and separation | Not started | — |
| M4: integrated editor | Partial: edit/undo/playback; broader browser checks pending | `src/app.mjs` |
| M5: two applied scores | Not started | — |
| M6: musical evaluation | Not started | — |
| M7: submission release | Not started | — |

## Work item template

- Purpose and musician-facing behavior:
- Scope / exclusions:
- Acceptance criteria:
- Branch / PR:
- Checks actually run and results:
- Listening / visual evidence:
- Known limitations:
- Next action:

Update this ledger with completed evidence, not anticipated results. Record pushed commit IDs in PRs or handoffs; avoid trying to embed a commit's own hash inside itself.
