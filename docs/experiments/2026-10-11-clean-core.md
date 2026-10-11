# Clean source verification — 2026-10-11

Exported committed revision `62d99e3c590f7c01171df8163dd8ff11a1c0b314` with `git archive` and extracted it into the sibling folder `tonescript-clean-62d99e3`. This folder did not inherit the working checkout's node_modules, source recordings, Python environment, models, or generated outputs.

Ran `npm ci --offline`, `npm run check`, and `npm run fixtures` there. Installation succeeded (77 packages; audit reported zero vulnerabilities), lint and syntax passed, all 42 tests passed, and all four synthetic score/neutral renders reported zero limited samples. Commands completed with exit code zero. Local HTTP tests required execution outside the restricted sandbox.

This proves the core source export installs from the existing package cache and passes its documented checks independently of untracked project assets. It does not prove an uncached installation, fresh Python/model installation, real-recording regeneration without downloads, or perceptual quality. The separately verified GitHub CI at this revision also passed on its Linux runner.

The local review ZIP remains tied to the same clean revision. Listening observations, manual musical fragments/corrections, browser file round-trip evidence and the final essay remain pending. No final release gate is claimed.
