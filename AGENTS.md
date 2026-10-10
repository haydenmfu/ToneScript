# Working on ToneScript

Read `docs/WORKFLOW.md`, `docs/EVALUATION.md`, and `docs/PROGRESS.md` before implementation. Follow the milestone gates and keep the ledger accurate.

- Build an original, musician-readable timbre notation applied to two contrasting excerpts. The code supports this musical objective.
- Separate musical scaffolding, timbre instructions, and renderer interpretation. Never claim stem playback proves reconstruction from notation.
- Use small branches and coherent commits. Push verified increments under the user's authorization; do not batch all publication until the end. Never force-push the default branch.
- With the first executable code, add appropriate tests and CI. Run relevant checks before pushing and report exactly what passed or remains unverified.
- Sound changes require listening evidence; notation changes require visual inspection. Do not fabricate either. If listening cannot be assessed, state that limitation and leave the perceptual criterion pending.
- Keep recordings, credentials, model weights, and large outputs out of ordinary Git. Record input and model provenance and manual corrections.
- Document consequential architecture decisions and preserve evidence for the reflection. Do not write invented first-person experiences for the student.
- No recurring automation or background continuation is implied by this workflow.
