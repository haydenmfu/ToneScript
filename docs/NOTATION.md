# ToneScript notation v1

This is an initial vocabulary to test, not a validated universal model of timbre.

Time runs left to right in seconds. Rows identify sound layers without representing pitch. Blank intervals represent silence. Overlapping events within one layer occupy additional vertical slots; this stacking does not indicate pitch, loudness, or another instrument.

| Property | Readable notation | Electronic interpretation |
| --- | --- | --- |
| Brightness | Blue/dark to gold/light, plus B values 0–100 | Harmonic amplitude slope and noise low-pass cutoff |
| Noise-like character | Increasing white dot density, plus N values 0–100 | Linear blend between a harmonic carrier and deterministic filtered noise |
| Entrance | Length of rising left slope | Linear onset amplitude envelope in seconds |
| Release | Length of falling right slope | Linear release envelope in seconds |

Brightness and noise each have a start and end value with linear interpolation. The score stores values 0–1; the visible notation scales them to 0–100. Values use the same mapping across studies. No independent per-study rescaling is applied.

Pitch (fractional MIDI note or null), gain, and duration are separate scaffolding. Decay is an exponential envelope parameter 0–12. These values appear in the inspector and SVG tooltips but are not fully encoded by the ribbon. Therefore playback reconstructs the stored score, not the static picture alone. This is an explicit limitation to revisit with musicians.

Unpitched events use noise without inventing a note. The score validator requires their noise values to be [1,1], matching the full noise carrier used by the renderer. This is a renderer limitation: an unpitched sound is not necessarily perceptually pure noise, and this model does not separately express inharmonic ringing. The synthesized sound is one interpretation, not a clone of an instrument.

The renderer uses at most 16 harmonics below 45% of sample rate, event-local seeded noise, and fixed 0.25 master gain. A hard safety limit at ±0.98 counts affected samples; no automatic per-render peak normalization hides loudness differences. Evaluation comparisons require separate documented level matching.

Artifacts or examples of brightness and noise estimates must not be described as direct measurements of perceptual timbre. Attack/decay also interact with articulation; the essay should explain that choice rather than claim strict perceptual independence.

For reader evaluation, use an enlarged excerpt when short gestures hide their numeric B/N labels. Do not assume color alone is sufficient in grayscale or for every reader. See `FEEDBACK_KIT.md` for explicit comprehension checks and `REFLECTION_DRAFT.md` for the distinction between engineering evidence and listening observations.
