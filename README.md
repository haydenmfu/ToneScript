# ToneScript

A readable, editable, playable score for how music sounds.

ToneScript explores a round trip: **recording → sound layers → timbre score → reconstructed performance**. Editing the score should audibly change the reconstruction. Musicians should be able to read the score independently of the software.

The first prototype includes a versioned score, deterministic harmonic/noise renderer, browser editor, playback, undo, and JSON/SVG/WAV exports. It currently opens synthetic test studies; automatic analysis and the two assignment transcriptions are not yet implemented. Listening evaluation is pending.

## Run locally

Requires Node.js 22 or newer. No runtime packages or model downloads are needed for the core prototype.

```sh
npm ci
npm run check
npm start
```

Open `http://127.0.0.1:4173`. Select a gesture, change its properties, and play the score or neutral baseline. Reference audio is optional and remains separate from reconstruction. `npm run fixtures` writes synthetic score documents, static SVG notation, and WAV comparisons to ignored `outputs/fixtures/`.

See [notation and rendering semantics](docs/NOTATION.md) for the meaning and limits of the current symbols.

## Project contract

- Invent a linear notation for timbre and apply it to two contrasting, short musical excerpts.
- Preserve pitch, timing, duration, and dynamics as explicitly separate supporting information where reconstruction needs them.
- Make timbre instructions understandable to a musician and executable by a renderer, with limitations documented.
- Compare original, reconstructed, and edited audio without implying that approximation is exact recovery.
- Produce two static scores, recording links with excerpt timestamps, a demonstration, and an approximately 1,000-word reflection grounded in actual observations.

## Start here

1. [Development workflow and milestone gates](docs/WORKFLOW.md)
2. [Evaluation protocol](docs/EVALUATION.md)
3. [Architecture and decision register](docs/ARCHITECTURE.md)
4. [Progress ledger](docs/PROGRESS.md)

Use small milestone branches and push verified increments. The detailed workflow defines when to commit, how to review, and what evidence each milestone must retain. Day numbers are relative planning targets, not scheduled automations.
