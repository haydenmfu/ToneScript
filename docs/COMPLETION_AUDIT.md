# Completion audit — active work, not a completion claim

## Verified update — 2026-10-11

A [clean source export check](experiments/2026-10-11-clean-core.md) now passes cached dependency installation, all 42 tests, lint/syntax and four deterministic fixture renders. Fresh optional Python/model installation remains unverified.

The dated snapshot below is historical. Current published HEAD is `62d99e3c590f7c01171df8163dd8ff11a1c0b314`, with a clean checkout before this documentation update. [Draft PR #1](https://github.com/haydenmfu/ToneScript/pull/1) is open. Both [PR CI](https://github.com/haydenmfu/ToneScript/actions/runs/38065130864) and [push CI](https://github.com/haydenmfu/ToneScript/actions/runs/38065126803) passed at that exact revision. The full local suite reached 42 passing tests; both final SVGs were visually inspected after narrow-texture and label-wrapping fixes.

The offline review packet and ZIP are present locally, including reference/neutral/score/edited audio, two counterbalanced comparison pages, source credits, full-value tables, facilitator key and response sheet. The packet manifest identifies `62d99e3` and a clean generation state. Structured before/after correction history now supersedes the generic-history limitation below; legacy entries retain their original detail. Browser reference loading, Demucs completion, source-audition status and PNG export have direct evidence in the integration record. Browser file save/reopen, actual listening corrections, hand-authored musical fragments, participant results, the finished reflection and release remain unfulfilled. No milestone is newly declared complete by this update.

Audit date: 2026-10-10. Contract: [WORKFLOW.md](WORKFLOW.md), including every M0–M7 gate and required engineering practices. Snapshot: branch `feat/m1-playable-score`, HEAD `eddad57`, with substantial uncommitted implementation and documents. The initial audit checkpoint had 24 passing tests. After independent regression findings and fixes, the root verified **38/38 tests plus lint and syntax checks passing**; this audit did not independently rerun them. See [core review](experiments/2026-10-10-core-review.md) and [integration evidence](experiments/2026-10-10-integration.md). Browser export/audition checks remain in progress. README and the progress ledger have now been refreshed; the initial stale-document finding is resolved.

**Achieved** means the stated bounded requirement has direct evidence; it does not imply its entire milestone passed. **Partial** means implementation or preparation exists but required verification/application remains. **Pending** means no completed evidence was found. An absent record is not proof a feature is absent; it means the gate cannot yet be credited.

## Evidence register

| ID | Authoritative artifact / result | What it supports, and what it does not |
| --- | --- | --- |
| E1 | [Source manifest](../data/sources.json), [fetch script](../scripts/fetch-examples.mjs) | Two identified recordings, exact adaptation/boundaries, source and license links, input hashes. Does not substitute for final link/access checks. |
| E2 | [Notation](NOTATION.md), [score contract](../src/score.mjs), [SVG renderer](../src/notation.mjs), [stack decision](decisions/0001-core-spike.md) | Defined vocabulary, versioned JSON, validation, overlap layout. Readability by musicians remains untested. |
| E3 | [Synthesizer](../src/synth.mjs), [core tests](../test/core.test.mjs), [comparison logic](../src/comparison.mjs) | Deterministic score-only interpretation, scaffolding preservation, isolated edits, gain matching, clipping metrics. Numerical checks do not prove perceptual success. |
| E4 | [Analyzer](../src/analysis.mjs), [analysis tests](../test/analysis.test.mjs), [historical trumpet report](../outputs/analysis/trumpet-report.json), [historical mixture Choice report](../outputs/analysis/choice-report.json), [core review](experiments/2026-10-10-core-review.md) | Initial v1 outputs had 9 trumpet and 40 mixture gestures. Regenerated v2 applied scores have 4 trumpet and 75 separation-assisted Choice gestures. These are suggestions, not verified transcriptions; distinguish mixture and separated counts. |
| E5 | [Separation script](../scripts/separate.py), [HPSS report](../outputs/separation/choice-hpss/report.json), [Demucs report](../outputs/separation/choice-demucs/report.json) | Actual offline runs, versions/settings/runtime, input/model identity where applicable; reports explicitly mark listening pending. |
| E6 | [Job manager](../scripts/jobs.mjs), [server](../scripts/server.mjs), [backend tests](../test/server.test.mjs) | Local upload → separation → assembled score interface, validation, cancellation, timeout, all estimated lanes retained. The HTTP unit tests inject a fake separator and are not themselves model evidence. |
| E7 | [Real HPSS job report](../outputs/jobs/1ad4df37-ed28-46a8-b6bb-7b537ce9528f/report.json), [its score](../outputs/jobs/1ad4df37-ed28-46a8-b6bb-7b537ce9528f/score.json); [real Demucs job report](../outputs/jobs/9800cccb-80e5-42b6-a264-70bcb3d30f36/report.json), [its score](../outputs/jobs/9800cccb-80e5-42b6-a264-70bcb3d30f36/score.json) | Completed integrated runs on 20-second input: HPSS about 10.16 s and Demucs about 30.88 s in these recorded runs. Distinct from the standalone runs; not comparative benchmarks. |
| E8 | [Editor](../src/app.mjs), [audio worker](../src/audio-worker.mjs), [initial browser experiment](experiments/2026-10-10-core-spike.md) | Editor operations, reference/score separation, local persistence, exports, analysis integration; the dated browser record covers the early prototype only. |
| E9 | [Trumpet draft](../examples/trumpet.json), [Choice draft](../examples/choice.json), [trumpet static page](scores/trumpet.html), [Choice static page](scores/choice.html), [study builder](../scripts/build-studies.mjs) | Concrete application to real audio, full tables and visuals. Draft labels and pending review are intentional. |
| E10 | [Trumpet study report](../outputs/studies/trumpet-report.json), [Choice study report](../outputs/studies/choice-report.json) | Raw/matched reconstruction, neutral, deliberate edit, and matched reference artifacts; gains/target and edit recorded. No listening preference follows from export success. |
| E11 | [Feedback kit](FEEDBACK_KIT.md), [blank response form](feedback/SESSION_TEMPLATE.md), [reflection scaffold](REFLECTION_DRAFT.md), [submission checklist](SUBMISSION_CHECKLIST.md) | Ready-to-use procedure and preparation. Blank forms and scaffolding are not participant results or a finished essay. |
| E12 | [CI](../.github/workflows/check.yml), [package/commands](../package.json), [lockfile](../package-lock.json), [audio lock](../requirements-audio-lock.txt), [.gitignore](../.gitignore), [integration record](experiments/2026-10-10-integration.md) | Local checks and CPU fixture CI defined; cached fresh `npm ci --offline` and source checksum fetch verified. Remote execution, uncached-machine and fresh optional Python setup remain unverified. |

`outputs/` links refer to reproducible local evidence deliberately excluded from Git. A remote reader cannot follow those links unless the corresponding reports/media are published as permitted artifacts or summarized in a committed experiment record. Preserve the evidence before cleaning generated output.

## M0 — requirements, excerpts, and evaluation agreement: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Establish the musical objective and acceptance questions | Achieved | [Evaluation protocol](EVALUATION.md), E2/E11 distinguish timbre, scaffolding, notation, and interpretation. |
| Select two contrasting short excerpts and record links, version, timing, use, access | Achieved for selection/provenance | E1: exposed trumpet and overlapping drum/bass adaptation. Inputs produced actual E4/E5 outputs. Final source-link check remains M7. |
| Both inputs available for analysis | Achieved locally | E4/E5/E7 are completed processing records, not merely planned downloads. |
| Confirm musically meaningful contrast | Partial | Texture-based rationale is documented in E1. Student listening should confirm what contrast actually matters to the notation. |
| Interview or arrange musician feedback; agree procedure/criteria | Partial | E11 defines prompts and descriptive targets. No actual arrangement, participant consent, frozen target times, or completed responses recorded. The user must arrange people; no outreach has been sent. |

## M1 — notation, hand-authored fragments, schema, static rendering: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Invent and explain the notation | Achieved as a first design | E2 defines independent visual meanings and disclosed limitations. |
| Hand-author a score fragment for each real excerpt | Pending | Synthetic [studies](../src/examples.mjs) are hand-authored fixtures; E9 are automatic real-audio drafts. Save an explicitly hand-authored/listening-corrected fragment for each reference, with its interval and reasoning. Do not relabel automatic suggestions as manual work. |
| Versioned data, schema validation, save/load round trip | Achieved at core level | E2/E3 and `score round trip preserves the complete musical document` test. Full browser file round trip belongs to M4. |
| Static rendering represents time, silence, overlap, legend | Achieved in implementation; reader gate partial | E2/E9; overlap and long-entrance regression tests are present. Inspect exported figures at submission size and collect comprehension evidence. |
| Document unresolved symbols | Achieved for known issues | E2 explains unpitched noise constraint, omitted scaffolding, short-mark labels, and descriptor limits. Additional listener confusion remains unknown. |

## M2 — score-driven renderer and audible editing: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Deterministic basic renderer with explicit musical scaffolding | Achieved | E3; note/gain/time remain explicit, event-local seeded noise is deterministic. |
| Saved score renders without reference/stem access | Achieved architecturally and in core tests | E3 renderer takes the score and options, not source audio. E10 exports are synthesized, not stem playback. |
| No clipping/invalid samples in chosen demonstrations | Achieved for recorded runs | E4/E10 report zero limited samples; core tests check finite/ranged output. Check again if final scores change. This does not promise every valid score avoids the limiter. |
| Neutral baseline retained with same scaffolding | Achieved | E3/E10 preserve raw and matched conditions. Neutral mode also changes envelopes; it does not isolate brightness alone. |
| Edits have audible, intended effects; interpretation musically useful | Pending perceptual evidence | E3 checks onset behavior numerically; E10 records a brightness edit. Student listening and E11 intentional-edit responses are still required. |

## M3 — analysis and separation suggestions: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Analyze recordings into editable suggestions | Achieved in code and generated results | E4 and E8; drafts and warnings exist for actual recordings. |
| Evaluate instrument/layer separation rather than indefinitely defer it | Achieved computationally; evaluation partial | E5/E7 run HPSS and Demucs; E6 integrates both. A successful run is not a successful perceptual decomposition. |
| Fixed inputs/settings/model identity and runtime provenance | Achieved for recorded settings/outputs; repeatability partial | E1/E4/E5/E7 and pinned dependencies identify runs. Explicitly rerun/check a chosen fixture if claiming repeatability across clean setups or environments; do not equate pinned metadata with that test. |
| Failures and artifacts visible | Partial | E4 warning strings, E6 error/cancellation paths, and model-estimate labels exist. Genuine audible leakage/missing-detail observations are not recorded. |
| Original versus separated listening comparison recorded | Pending | E11 supplies the comparison log; no filled log found. Compare common timestamps, not only whole-file impressions. |
| Choose mixture/separation representation based on evidence | Partial | E9 Choice currently uses Demucs estimates. Its final musical advantage over mixture/HPSS has not been established; preserve and compare alternatives before final selection. |

## M4 — complete editor and export path: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Integrated editor, undo, synchronized playback | Achieved in implementation; verification partial | E8 has seek/playhead, lane solo, inspector, undo, worker synthesis, reference modes, autosave, and stale-result guards. Initial browser evidence covers editing/undo/progressing cursor. Record current expanded browser checks. |
| Import → inspect → edit → save → reopen → render | Partial | E8 contains every operation and core round trips pass. Need one recorded complete real-study browser journey, including a downloaded file reopening with the intended change. |
| Audio and score alignment checked | Partial | Cursor implementation and early playback check exist. Verify reference excerpt offset and known event boundaries against actual audio; a moving cursor alone does not establish correct alignment. |
| Original/reconstruction/edited comparison | Achieved offline; browser semantics partial | E10 gives A/B/C/D files. E8 supports original/neutral/current score; editing changes the current score and undo restores it. No dedicated frozen edited-condition slot is required by the workflow, but document this distinction and preserve comparison snapshots. |
| Static export works | Partial | E9 SVG/HTML generated; E8 SVG/PNG exports implemented. Verify browser downloads and inspect final images/print layouts. JSON/WAV export also needs the complete browser journey above. |
| Separation path usable end-to-end | Achieved backend; browser verification partial | E7 confirms real jobs assembled scores. Complete browser separation, resulting score load, cancellation, and reference-retention checks; server tests alone do not cover this UI path. |

## M5 — complete applications to both recordings: PARTIAL

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Two concrete scores and reconstructions | Achieved as drafts | E9/E10. These exceed a prose-only proposal but remain unreviewed applications. |
| Same notation semantics across excerpts | Achieved in current implementation | Shared E2/E3 mappings, no independent per-study rescaling. Confirm any final manual change preserves the legend. |
| Corrections and ambiguous passages logged | Partial | E8 stores review notes/flags and generic manual-edit entries. No completed listening correction log found. Save original/revised scores and record field/before/after or enough detail to reconstruct the correction; generic “editor modification” is insufficient alone. |
| Scores/reconstructions complete for chosen boundaries | Partial | Full chosen durations exported. Human review must determine whether gestures and layers are musically adequate; coverage of elapsed time is not transcription completeness. |
| No undisclosed removal of difficult passages/layers | Achieved for current disclosed draft scope | E1 states short boundaries/adaptation and E9 retains all four estimated Demucs groups, including empty/faint lanes. Record any later pruning and why; names do not establish source presence. |

## M6 — listener evaluation and revision: PENDING RESULTS

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Evaluate with listeners | Partial preparation; results pending | E11 ready; participant count remains zero recorded responses. Do not report utility as validated. |
| Notation comprehension | Pending | Freeze cues/times and use five-item comprehension task plus timed following in E11. |
| Intentional-edit recognition | Pending | E10 supplies an edited version; E11 distinguishes open answers from prompted direction. Confirm meaningful edit before testing. |
| Neutral-versus-scored reconstruction comparison | Partial | Controlled files and gain reports exist; actual preferences/reasons do not. Retain no-preference answers. |
| Failures produce revisions or explicit limitations | Partial | Engineering fixes/known limits documented, but participant-driven revisions cannot yet be claimed. Save before/after evidence if a reader prompts a change. |

## M7 — reproducible final submission and release: PENDING

| Requirement | Status | Evidence and remaining action |
| --- | --- | --- |
| Freeze features | Pending | Active implementation, uncommitted changes, and browser testing continue. Freeze after substantive checks, without waiting until October 25. |
| Clean setup/reproducibility check | Partial | E12 records a fresh Node package reinstall from cache and repeated source checksum verification. This is not a fresh uncached machine or Python environment; complete any remaining clean-checkout journey and document those limits. |
| Demonstration and final exports verified | Partial | E9/E10 artifacts exist, E11 checklist ready. Need final visual/listening verification and a concise reproducible demonstration. |
| Links and excerpt boundaries checked | Partial | E1 includes exact links/hashes and processing uses boundaries. Verify final references open and document the adaptation; inspect uploaded submission links. |
| Approximately 1,000-word reflection reflects actual work | Partial preparation; essay pending | E11 reflection scaffold is intentionally a draft with personal/listening gaps. It must not be submitted as if those prompts were completed observations. |
| Final release tagged | Pending | No local tags found at audit snapshot. Do not create a completion tag before gates pass; verify pushed annotated tag when appropriate. |

## Engineering and publication audit

| Requirement | Status | Evidence / action |
| --- | --- | --- |
| Stack spike, lockfile, installation instructions, check command | Achieved in documentation/configuration | E2/E12 and updated [README](../README.md) describe current core, optional separation, source fetching, and study regeneration. Fresh-platform reproducibility remains a separate gate. |
| CI with lint/checks, unit tests, deterministic end-to-end fixture | Achieved in configuration; remote execution pending | E12 now runs lint/check/tests and synthetic fixture generation on CPU. Verify the actual current remote run after publishing. |
| Semantic tests required by workflow | Achieved in current test coverage | E3/E4/E6 tests cover timing/bounds, silence, overlap, versions, serialization, invalid inputs, score-only rendering, controlled edits, codecs, comparison gain, backend jobs. Independent regressions prompted fixes and expanded coverage; root verified aggregate 38/38 plus lint/syntax. |
| Licensed/generated fixtures and excluded heavy/private artifacts | Achieved in layout; publication check needed | E1/E12 and synthetic fixture generator. Inspect staged files before commit; ignored outputs need a delivery location if intended for review/submission. |
| Pin inputs/model/settings/environment and record runtime | Achieved for current reports; clean reproducibility pending | E1/E5/E7/E12. Hardware/runtime fields should remain associated with the actual run, not generalized as expected performance. |
| Sound-changing PR includes listening notes and examples | Partial | E10 precise local audio paths available; no human listening notes yet. Label any current PR as a checkpoint with this gate pending. |
| Notation-changing PR includes before/after visuals and meaning | Partial | E2/E9 describe meaning and current images; preserve an explicit before/after pair for the changed layout. |
| Branch/work item/commit/push | Partial | Feature branch exists; local and tracking branch point to `eddad57` at inspection. Current additions are uncommitted. [Progress ledger](PROGRESS.md) now records current work item/criteria/results and historical checkpoints. Tracking refs are not fresh remote verification. |
| Early draft PR, review, required checks | Pending verified publication evidence | PR template exists. No current PR URL/status or remote CI result was available to this audit. Root should record a verified URL/status or the workflow's documented comparison-link fallback. |
| Merge only when gates pass; milestone annotated tags | Pending | Do not infer permission to merge or mark milestones complete from passing software tests while musical gates remain unmet. No tags found. |
| Honest musical evidence and full scope | Achieved in current documentation | Draft labels, pending feedback, and score-versus-stem distinction remain explicit. This audit preserves M0–M7 rather than reducing “done” to the app. |

## Next work that can proceed immediately

1. Finish the current browser journey and persist evidence for imports, editing/undo, score save/reopen, reference alignment controls, SVG/PNG/WAV export, and real separation/cancel behavior. Fix failures and rerun only affected checks.
2. Keep the refreshed README/progress ledger and current integration record synchronized with final browser outcomes, local media paths, aggregate 38-test result or its successor, and unverified perceptual gates.
3. Preserve useful manual-correction evidence: retain before/after JSON and record a changed field/value/reason, not only a generic action. Hand-author a real-excerpt fragment with the student's listening before crediting M1's specific requirement.
4. Verify clean setup and current remote CI after a coherent checkpoint is committed/pushed. Record PR/publication state and remote commit; keep draft status where gates remain pending.
5. Prepare final readable exports and source attributions now. Run the listening/feedback kit as soon as a person is available; use resulting observations to complete scores, decide layer representation, and write the actual reflection.

Independent software/document work should continue while human feedback is pending. None of the pending perceptual requirements can be fulfilled by generating a favorable narrative, running another numerical test, or merely waiting until the deadline.
