# ToneScript listening and notation feedback kit

Status: ready-to-run protocol, not completed research. No participant feedback has been collected by this document. Use alongside `EVALUATION.md`; the criteria below operationalize its questions. Do not wait for the submission deadline to run it. Continue implementation and artifact preparation while arranging voluntary feedback yourself; this kit does not authorize contacting anyone.

## Freeze before the first response

Copy `feedback/SESSION_TEMPLATE.md` for the study plan and each participant. Save the score files, original/neutral/score/edited audio, SVGs, commit, render settings, and comparison gains. Fill all PREDECLARE fields before testing. Changes afterward create a new protocol version; keep earlier responses.

Use these actual applications from `data/sources.json`:

| Excerpt | Boundary | Current draft to review |
| --- | --- | --- |
| Mihai Sorohan, *solo trumpet 06* | 0–5.333379 s of linked reference | `examples/trumpet.json`, 4 suggested gestures (analyzer v2) |
| Admiral Bob featuring Snowflake, *Choice — drum and bass excerpt* | 0–20 s of the librosa drum/bass adaptation | `examples/choice.json`, 75-gesture separation-assisted draft; the earlier `outputs/analysis/choice.json` has 40 mixture gestures from analyzer v1 and must be regenerated before a current algorithm comparison |

These counts describe generated drafts, not verified note counts. The Choice boundary is relative to the adaptation, not the full original song. Listen before selecting two clear change points per excerpt; enter timestamps, direction, and tolerance now. If no clear change is available, choose a documented shorter passage or different task before collecting responses. Do not select only changes that participants later identify successfully.

Aim for 3–5 volunteers, including a musician if available. Record broad musical experience and an anonymous ID only. One or two responses can guide revisions but cannot validate general musician utility. Participation is optional; ask permission to retain anonymous comments and allow skipping. Do not record audio or identifying information by default.

## Session script (about 15 minutes)

1. Say: “This is an experimental way to write sound character over time. I am testing the notation, not your musical ability. Confusion and disagreement are useful.” Show the legend for 60 seconds. Explain that rows do not mean pitch and height does not mean loudness. Do not teach the answers to individual tasks.
2. Show a score. Ask: “Where does time begin? What does blank space mean? What does blue changing to gold mean? What do more dots mean? What does a longer left slope mean?” Save exact or close-to-verbatim answers before explaining anything further.
3. Play each reference once with its score; allow one replay. Use the two frozen verbal cues for that excerpt, such as “Mark where the foreground sound begins its clearest brightening.” The cue must identify an audible kind of change without giving its time or pointing to the answer. Ask the reader to mark its time and describe it. Record timestamps and words, including uncertainty. Do not reveal target times until both excerpts are finished. If a cue is ambiguous in pilot listening, revise it before independent testing rather than scoring a plausible alternative as an error.
4. Hide condition labels. Play reference A, then neutral B and scored C as anonymous X/Y. Ask: “Which better preserves the reference's sound character: X, Y, or no preference? What did you hear?” Alternate B/C order across participants and excerpts using the frozen order table. Keep order hidden from the participant, not the experiment record. This is a small counterbalanced comparison, not a fully blinded laboratory study.
5. Play C and a version D with exactly one frozen brightness edit on a pitched gesture. Ask first: “What changed?” Then offer “brighter / darker / no clear change / something else.” Retain both the open and prompted answers. Do not use an unpitched gesture for a noise edit, because that carrier is constrained to full noise.
6. Ask: “Which mark was hardest to understand? What sound quality is missing? Could you use this to describe or perform a gesture?” If a musician wants to demonstrate, log their interpretation without treating exact imitation as required.

Do not correct answers mid-task. Afterward, explain the design and invite suggestions. Keep student/self-listening records separate from independent feedback.

## Predeclared descriptive criteria

These are design targets, not established psychometric thresholds. Report raw counts and disagreements, even if targets are missed. Each participant and each excerpt remain visible in the results.

| Question | Scoring rule frozen before testing | Design target |
| --- | --- | --- |
| Legend comprehension | Five answers above: time direction, silence, brightness, noise-like character, entrance. Give 1 for correct meaning in the reader's own words, 0 otherwise; retain ambiguous wording. | At least 4/5 per reader. |
| Following timbral change | Four target changes total; correct direction and time within ±0.5 s for trumpet, ±1 s for Choice. Freeze targets before use. | At least 3/4 per reader. |
| Intentional edit recognition | One edited pitched gesture per excerpt; record open answer separately from prompted direction. | Correct prompted direction on both; report open-answer success separately. |
| Reconstruction comparison | B/C preference for each excerpt; include no preference and reason. | Exploratory; no pass/fail preference threshold. |
| Actionability | Musician's explanation or optional performance, plus a confusing/missing quality. | Qualitative evidence; do not collapse to a utility claim. |

If fewer than three independent readers participate, label findings “pilot feedback.” With any sample size here, do not claim statistical significance or universal perceptual validity. Revise a confusing symbol based on a documented reason; rerun changed tasks as a new version and retain the original failures.

## Fair audio comparisons

Preserve identical event start/duration, pitch, gain, and seed in B/C/D. B is the code's neutral interpretation: fixed brightness, tonal carrier for pitched events, noise carrier for unpitched events, and neutral envelope settings. C changes the complete timbre instruction set, including envelope. Thus B/C does not isolate brightness alone. D changes only the declared score field relative to C.

Use `outputs/studies/{trumpet,choice}-{reference,neutral,score,edited}-matched.wav` and copy the corresponding study report's actual gains, target, edited gesture, and edit description into the frozen record. Inspect the edit before testing; regenerate it if it is not an audible, meaningful test. The report is the authority for the generated edit, not an assumed event number. The static score and full gesture table are in `docs/scores/{trumpet,choice}.html`; use these to recover short marks' exact values.

The shared comparison implementation lowers the RMS target to keep every peak within 0.95. Raw files are retained separately. Do not substitute the unequal-level WAVs in `outputs/analysis/` for matched study copies. Use one playback setup and fixed volume. Equal RMS reduces a loudness confound; it does not guarantee equal perceived loudness. Stop or lower volume if uncomfortable. If using app playback instead, record its actual condition set and gains rather than assuming it matches the four-condition export.

Reference A can be a level-adjusted comparison copy with documented gain. Do not alter the saved source. Keep score viewing out of the anonymous B/C preference task so color labels do not reveal the condition.

## Separation comparison (student listening plus optional volunteers)

Compare the exact same 0–20 s Choice excerpt using: mixture analysis; HPSS harmonic/percussive outputs; Demucs bass/drums outputs. Keep raw stem gains intact when evaluating leakage and recombination. Solo listening may use a documented common boost for audibility; do not normalize every stem independently and then infer its importance in the mix.

For each method, note a timestamp for apparent leakage, softened attacks, missing sustained detail, or a genuinely clearer layer; “none noticed” is valid. A model's `vocals` output is not proof a singer is present. HPSS separates harmonic/percussive tendencies, not instrument identities. A low sum residual only measures recombination, not clean isolation.

Generate/edit scores using the same analyzer settings and legend. Compare the same two preselected moments, number and type of manual corrections, and reader confusion. More lanes or more gestures are not automatically better. Record whether the final Choice score uses mixture, HPSS, Demucs, or manual layers and why. If listening does not establish an advantage, retain the simpler readable score and report the uncertainty; keep the separation experiment as evidence.

## Report after testing

State actual participant count, musical experience categories, order, missing answers, raw task results, and 2–3 anonymous comments only with permission. Separate technical outcomes, your listening, and others' responses. Link before/after scores and explain any revision. No collected responses means “evaluation pending,” never “users found it intuitive.”
