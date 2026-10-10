# ToneScript

A readable, editable, playable score for how music sounds.

ToneScript explores a round trip: **recording → sound layers → timbre score → reconstructed performance**. Editing the score should audibly change the reconstruction. Musicians should be able to read the score independently of the software.

This repository currently contains the project plan and development process; no audio analysis, editor, or renderer has been implemented or validated yet.

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
