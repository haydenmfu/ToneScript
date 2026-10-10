# 0002 — Editable audio suggestions with optional source separation

Status: implemented for technical evaluation; perceptual selection remains pending.

The score remains the only input to reconstruction. Browser reference playback and audition of estimated source audio are separate, explicitly labeled modes. This lets a musician compare a suggestion with its source without confusing stem playback with synthesis from notation.

Analysis runs in a JavaScript worker using fixed spectral descriptors and a dominant-period estimator. Version `spectral-gesture-v2` replaces unfiltered decimation with full-rate YIN-style differences and interpolation after regression tests exposed octave errors and aliasing. This estimates one pitch per frame, not chords or instrument identity. The source, input hash, frame settings, and estimator limitations travel with the draft. Brightness and noise descriptors are proxies requiring listening correction, not calibrated perceptual measurements.

The local server accepts bounded mono WAV excerpts and starts an isolated Python process for HPSS or Demucs. HPSS exposes harmonic/percussive tendencies; the pretrained `htdemucs` model estimates drums, bass, other, and vocals. All returned groups are retained, including weak or empty groups, so the display does not conceal leakage by dropping categories. Original and normalized analysis stems have explicit sample rates and report metadata. Job cancellation, timeout, validation and failure reporting are tested.

Both approaches ran on the Choice excerpt. Those runs establish compatibility and timing only. Choosing the more musically useful representation still requires original-versus-separated listening. The exposed trumpet draft uses mixture analysis because a source-separation step is unnecessary for its initial technical demonstration.

The editor records corrections with source event identifiers and before/after values. “Reviewed by listening” is a user assertion, not an automated certification. Legacy generic edit records cannot recover missing detail retrospectively. Undo restores the earlier score and its history.

Consequences: the application remains local and the core renderer has no model dependency; optional analysis setup is larger. Separation errors, pitch mistakes and descriptor ambiguity remain visible and correctable. No claim of automatic faithful transcription or convincing instrumental cloning follows from passing software checks.
