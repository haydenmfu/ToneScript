# Browser score round trip — 2026-10-11

Opened the trumpet draft, changed the first gesture label to `Round-trip test`, and saved through the editor's Save score control. Inspected the downloaded JSON: the label and one structured correction record were present; no listening-reviewed flag was asserted. Preserved the file locally as `outputs/studies/browser-roundtrip.json`.

Switched to Study 02, then imported that saved file using Open score. The editor reported “Score loaded and validated”; the inspector restored `Round-trip test` and one saved correction record. Playback reached the explicitly labeled score-only synthesis status. Undo restored the previous study. This verifies the actual file path in addition to the existing structural serialization tests; it does not establish perceptual quality.

Found a separate issue: recovered/imported scores left the study selector pointing at an unrelated built-in example, allowing Reset to load that example. The editor now tracks the selected base study separately, restores that identity on Undo, and labels imported/recovered scores explicitly with Reset disabled. Browser checks confirmed: recovered score → Reset disabled; selecting a built-in → Reset enabled; Undo back to recovered score → Reset disabled.

The browser download tool returned after an unusually long delay despite a requested timeout. The file was successfully written. No duplicate download was attempted. Avoid treating tool latency as application rendering latency.

Remaining musical requirements: listening corrections and hand-authored fragments, reader responses, final reflection and final release. No new listening claims follow from these checks.
