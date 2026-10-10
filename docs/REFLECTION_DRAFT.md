# DRAFT: reflection preparation, not a finished student essay

Target: about 1,000 words. The eight paragraph budgets below total 1,000. Write in your own voice after reviewing the recordings and scores. Bracketed prompts require your actual observations; they are not claims to copy unchanged. Keep technical implementation brief enough that the essay centers on the musical experiment.

## Evidence available now

The source manifest identifies two real recordings, exact versions, licensing, checksums, and excerpt boundaries. The exposed trumpet reference lasts about 5.33 seconds. Choice is 20 seconds of a pre-existing drum/bass adaptation. This is a concrete contrast in texture; it does not establish how well the notation describes either recording.

The initial mixture analyzer reported 9 trumpet gestures and 40 Choice gestures. After the pitch-estimation fixes, the v2 applied drafts contain 4 trumpet gestures and 75 separation-assisted Choice gestures. It explicitly warns that spectral centroid depends on pitch and recording conditions, flatness is only a noise proxy, and mixture pitch estimates can be unreliable. These counts are algorithmic subdivisions, not an independent musical transcription. Applied drafts now exist in `examples/` and `docs/scores/`, with complete gesture tables accompanying the visual ribbons.

Both separation methods have actually run on the Choice excerpt. HPSS produced harmonic/percussive components in about 19.24 seconds; Demucs produced estimated drums/bass/other/vocals in about 13.26 seconds on the recorded environment. These are single recorded runs, not benchmark conclusions. Both reports say listening review is pending. HPSS's very small sum residual does not demonstrate instrument isolation. Low other/vocals energy from Demucs does not prove those sources are absent or present. The final choice of layers still needs an explicit listening-based rationale.

The synthesizer renders declared score data without reading the reference or stems. Its harmonic/noise interpretation is approximate. Matched study audio supports an original/neutral/scored/edited comparison. Actual technical checks are recorded in the progress ledger and experiment records; the first spike had 11 tests and subsequent work expanded coverage. A passing test or a browser Play action is evidence of software behavior, not evidence that the result sounds convincing. No musician-utility claim or first-person listening experience follows from these records.

## Paragraph plan (replace prompts with real experience)

### 1. The question and design choice — 100 words

Explain why you chose timbre and what you hoped a reader could do with the score. Distinguish naming an instrument from describing how its sound changes. Describe the role you intended for computation: generating suggestions and enabling playback, with listening determining whether the suggestions make sense.

Personal prompt: [What drew you to this approach rather than a completely handmade score? What did you initially expect to be easy?] Do not invent an initial expectation merely to give the essay a narrative arc.

### 2. How a reader follows the notation — 160 words

Describe left-to-right seconds, rows for layers, blank space for silence, and simultaneous stacked gestures. Explain blue-to-gold brightness, dots for noise-like character, and the entrance/release slopes. Clarify that vertical position is not pitch and height is not loudness. Introduce the same legend across both excerpts. Explain why three or four readable properties seemed manageable for this assignment rather than claiming they exhaust timbre.

Personal prompt: [Which symbol did you design or revise yourself, and why? What actual reader question revealed an ambiguity? If nobody has reviewed it yet, say that rather than inventing feedback.]

### 3. What playback adds and leaves out — 110 words

Explain that the stored score can generate an approximate sound, which allows you to hear the consequences of an edit. Pitch, timing, and gain are supporting musical scaffolding; they are not treated as timbre. The picture omits some values that appear in the companion table, including pitch, gain, and decay. The playback is therefore an interpretation of the complete stored score, not recovery of the recording from the colored image alone.

Listening prompt: [After changing one brightness value, what did you actually hear? Did another quality seem to change too? Give an event time.]

### 4. Applying it to the trumpet — 140 words

Identify Mihai Sorohan's *solo trumpet 06* and the 0–5.333379-second reference. Explain what makes an exposed phrase a useful first application. Mention the four current automatic gestures only if you relate them to a concrete listening decision; a software count alone is not a musical observation.

Listening prompts: [At a specific time, how would you describe the sound without instrument names? Which mark expressed it? Did the boundary split one sustained sound or merge two entrances? What correction did you make, if any?] Include one mismatch or uncertainty if present. Do not say “warm,” “breathy,” or “brassy” solely because the source is a trumpet.

### 5. Applying it to the contrasting excerpt — 160 words

Identify Admiral Bob featuring Snowflake's *Choice*, using the first 20 seconds of the linked drum/bass adaptation. Explain how overlapping sounds test a row-based notation. Describe mixture analysis versus estimated layers in ordinary language. HPSS groups harmonic/percussive tendencies; Demucs estimates named source groups. Neither label automatically certifies an instrument's identity.

Listening prompts: [Compare one exact moment in the mixture and a separated layer. What became easier or harder to notate? Did a transient leak into another layer or a sustained sound change? Which layer representation did you finally choose, and why?] State any manual adjustment and avoid describing automatic separation as perfect unless evidence warrants it; ordinarily the useful question is what it helps communicate.

### 6. Comparison and feedback — 120 words

Describe the same scaffolding played with neutral timbre, the score's timbre instructions, and one deliberate edit. Explain that comparison levels were controlled so louder audio was less likely to dominate preference. Keep engineering evidence separate from listening judgment.

Evidence prompts: [What was your own preference and why? How many other people actually responded? What did one reader understand or misunderstand? Was there disagreement?] If no outside responses are available, explicitly limit this to self-evaluation. There is no requirement to turn an unsuccessful comparison into a positive outcome.

### 7. What the system cannot capture — 130 words

Discuss one or two limitations that emerged from your work. Candidates supported by the design include pitch affecting the brightness estimate; noise-like character failing to express every form of roughness; source overlap; the renderer's limited sound vocabulary; and very short marks becoming hard to read. Choose those connected to actual examples rather than listing every technical caveat.

Observation prompt: [Which meaningful quality remained after you tried to describe the sound with the available controls? What did that teach you about hearing timbre?] Distinguish a limitation of the visual vocabulary from an error in automatic analysis and from a limitation of the synthesizer.

### 8. What you learned and would change — 80 words

Return to your initial aim. Explain what the experiment taught you about translating listening into a fixed symbol system. Name one justified revision, such as a clearer symbol, a new dimension, more readable short events, or better layer choices. Do not promise that more sophisticated software would eliminate subjective decisions.

Personal prompt: [What do you now listen for that you did not notice before? If that did not change, what assumption about notation did the experiment challenge instead?]

## Before turning this into prose

- Add at least one timestamped listening observation per piece and one documented revision or reason for retaining a mark.
- Fill the comparison log and report the actual feedback sample, including zero.
- Preserve source attribution and explain the Choice adaptation.
- Remove prompts, draft labels only when appropriate, and unsupported claims.
- Check approximate word count against the instructor's expectations; the assignment says “about 1000,” not an exact technical report length.

