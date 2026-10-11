# Architecture and decisions

Status: the pipeline below is implemented as a local browser editor, deterministic JavaScript renderer, and optional Python separation service. Musical usefulness and final applied scores still require listening review. See `COMPLETION_AUDIT.md` for the remaining gates.

## Pipeline

```text
Reference audio → optional separation → analysis suggestions
                                              ↓
                                    editable score document
                                      ↓               ↓
                                visual notation   audio renderer
                                      ↓               ↓
                                 static export    reconstruction
```

The editor and renderer share a versioned score contract. Analysis is replaceable and suggestions can be corrected. The renderer consumes the score and declared instrument/synthesis assets, not an implicit reference-audio fallback.

## Score layers

- Provenance: recording identity, excerpt offset, analysis version, manual edits.
- Musical scaffolding: timing, source lanes, pitch where meaningful, duration, and dynamics. Unpitched sounds must not require invented pitches.
- Timbre instructions: listening-defined properties and their evolution over time; initial candidates are brightness, noise-like character, and attack/decay shape. Confirm or revise through musical examples.
- Interpretation: renderer mapping/version and declared assets. Separate the musical meaning of a symbol from one synthesizer's implementation.
- Presentation: legible symbols, legend, timeline, descriptive labels, and accessible alternatives to color alone.

Source identity is not itself a timbre property. Uncertainty and corrections should be visible without inventing calibrated model confidence. Silence, overlapping sources, sustained gestures, and transient entrances must be representable.

## Decisions to resolve

| Decision | Resolve by | Evidence required |
| --- | --- | --- |
| Initial notation vocabulary | M1 | Hand-scored fragments from both contrasting excerpts; reader feedback if available |
| Data schema and timing units | M1 | Example documents and validation/round-trip tests |
| Implementation stack | M1 | Tiny import → score → render spike, Windows setup, export feasibility |
| Synthesis strategy | M2 | Score-only rendering plus audible controlled edits |
| Separation model and role | M3 | Primary documentation, reproducible run, artifact listening comparison |
| Musical scaffolding extraction | M3 | Pitch/timing checks; documented manual fallback where needed |
| Feature-to-symbol mapping | M3 | Listening comparisons, cross-excerpt meaning, failure cases |
| Final submission packaging | M5 | Course submission requirements, static export, accessible demo |

Record substantive decisions in `docs/decisions/NNNN-title.md`: context, alternatives, evidence, choice, and consequences. Do not convert untested proposals into claims of capability.

## Research starting points

These are precedents, not selected dependencies or guarantees of current compatibility:

- [Demucs](https://github.com/facebookresearch/demucs): pretrained music source separation.
- [Open-Unmix](https://sigsep.github.io/open-unmix/): source-separation reference implementation.
- [DDSP](https://magenta.tensorflow.org/ddsp): interpretable synthesis and timbre transfer.
- [MetaSynth](https://uisoftware.com/metasynth/): visual control of sound synthesis.
- [IRCAM orchestration research](https://www.ircam.fr/en/research/projects/85): approximating sound targets through instrumental combinations.

Recheck installation, maintenance, licensing, hardware, and model access when choosing dependencies. The project's original contribution is its notation and musical use, not an assertion that visual synthesis or separation is new.
