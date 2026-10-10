# ToneScript

A readable, editable, playable score for how music sounds.

ToneScript turns short recordings into editable suggestions for a timbre score: time runs left to right, color represents brightness, dots represent noise-like character, and slopes represent entrances and releases. Its synthesizer interprets the saved score using harmonics and noise. Pitch, timing, and gain are explicit supporting information; source recordings and separated stems are never inputs to that synthesizer.

The current implementation includes local recording analysis, optional HPSS/Demucs layer separation, a browser editor with undo and review notes, original/neutral/score comparisons, and JSON/SVG/PNG/WAV exports. Two real-recording applications and static scores are available as **drafts requiring listening review**. They are not validated instrument transcriptions. Human musical feedback and the student's final reflection remain pending; see the [progress ledger](docs/PROGRESS.md) and [completion audit](docs/COMPLETION_AUDIT.md).

## Run the editor

Requires Node.js **22.13.0 or newer** and npm. Run from the repository directory:

```powershell
npm ci
npm run check
npm start
```

Open [ToneScript locally](http://127.0.0.1:4173). The server binds to this computer only. `npm run check` runs lint, syntax checks, and tests; consult the progress ledger for actual results rather than treating these instructions as a recorded pass.

Choose a study, select a gesture, edit its properties, and play the score or neutral version. Applied drafts load from `examples/`; the two synthetic studies are test fixtures. Save JSON to preserve your work. Browser autosave stores the score but not the reference recording. Load matching reference audio separately to compare with the original. Review notes and reviewed flags are stored in the score.

Ordinary score editing, synthesis, and mixture analysis require no Python environment or downloaded model. Audio import uses browser decoding and supports short excerpts up to 120 seconds. Layer separation requires the optional local environment below. Named model outputs remain estimates; HPSS's harmonic/percussive groups are not instrument identities.

## Prepare the two reference excerpts

Install FFmpeg and make `ffmpeg` available on PATH, then run:

```powershell
npm run fetch-examples
```

This downloads the exact recordings in [the source manifest](data/sources.json), checks their recorded SHA-256 values, and prepares mono 22,050 Hz WAV excerpts in ignored `data/raw/`. It needs internet access and stops if a source checksum changes. In the editor, choose an applied study and load its matching local reference using the provided button.

- **Mihai Sorohan — solo trumpet 06:** 0–5.333379 seconds. [Recording reference](https://freesound.org/s/77711/); CC BY 4.0.
- **Admiral Bob featuring Snowflake — Choice:** 0–20 seconds of the linked librosa drum/bass adaptation, not an asserted location in the full original mix. [Recording reference](http://dig.ccmixter.org/files/admiralbob77/61638); CC BY-NC 4.0. The manifest preserves adaptation and license details.

Source audio stays outside Git. Preserve artist attribution, license links, and adaptation notices with shared derived material.

## Optional local separation

The recorded Windows environment used Python 3.13.5. The commands below create the `.venv` location expected by the server; the recorded dependency lock is the closest reproduction of that environment. A clean installation on other platforms/Python versions has not yet been established.

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements-audio-lock.txt
```

Start or restart `npm start`, load a recording, choose HPSS or Demucs, and run separation. Processing stays local; the first Demucs run downloads its model weights into ignored `models/`. Jobs produce reports, estimated stems, and editable scores in ignored `outputs/jobs/`. Cancellation and errors are exposed in the editor. The broader dependency declarations in `requirements-audio.txt` are useful context; use the lock above when reproducing the recorded setup.

To reproduce the fixed Choice experiments from the prepared WAV:

```powershell
.\.venv\Scripts\python.exe scripts/separate.py data/raw/choice.wav outputs/separation/choice-hpss --method hpss
.\.venv\Scripts\python.exe scripts/separate.py data/raw/choice.wav outputs/separation/choice-demucs --method demucs
```

Each report records input identity, method/settings, package versions, runtime, and model hashes where applicable. Successful processing does not establish clean separation; compare the outputs by listening before choosing final score layers.

## Generate review artifacts

After fetching the references and generating the fixed Demucs output above:

```powershell
npm run studies
```

This **regenerates the automatic drafts**, replacing `examples/trumpet.json`, `examples/choice.json`, and `docs/scores/` exports. Save manually reviewed versions under separate filenames before rerunning it. The builder creates:

- Applied JSON and static SVG/HTML pages with the complete gesture table.
- Raw score, neutral, and edited synthesis in `outputs/studies/`.
- Equal-RMS comparison copies of reference/neutral/score/edited audio, plus actual gain, target, and edit records. RMS matching is not a guarantee of equal perceived loudness.

The prepared [trumpet page](docs/scores/trumpet.html) and [Choice page](docs/scores/choice.html) can be opened directly as files. The static picture omits some synthesis parameters; the companion table makes those values explicit.

For separate mixture-analysis reports, use:

```powershell
node scripts/analyze.mjs data/raw/trumpet.wav outputs/analysis/trumpet "Trumpet mixture draft"
node scripts/analyze.mjs data/raw/choice.wav outputs/analysis/choice "Choice mixture draft"
```

`npm run fixtures` generates synthetic test scores and audio in `outputs/fixtures/`; those fixtures do not satisfy the assignment's two musical applications. Generated output, source recordings, model weights, and the Python environment are ignored by Git.

## Finish the musical project

The software supports the assignment's required outcome: one original notation applied to two contrasting excerpts, two readable scores with recording links and timestamps, and an approximately 1,000-word reflection grounded in actual experience.

Use the [notation guide](docs/NOTATION.md), [listening/feedback kit](docs/FEEDBACK_KIT.md), [blank response form](docs/feedback/SESSION_TEMPLATE.md), [reflection scaffold](docs/REFLECTION_DRAFT.md), and [submission checklist](docs/SUBMISSION_CHECKLIST.md). Automatic descriptors and instrument labels require listening corrections. Do not replace real observations with test results or present the reflection scaffold as a finished essay.

The [workflow](docs/WORKFLOW.md) defines milestone gates and incremental review/publication. October 25, 2026 is the deadline; work should continue rapidly and finish as soon as the evidence permits, without artificial waiting periods.
