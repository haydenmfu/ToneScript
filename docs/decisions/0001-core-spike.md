# 0001: browser-native editor and pure JavaScript score renderer

Date: 2026-10-10. Status: accepted for the initial core; analysis backend remains open.

## Context and alternatives

The notation must run interactively, export a readable artifact, and produce sound from its own data. A framework plus Python audio backend could support sophisticated extraction, but introduces installation and model dependencies before the score contract is proven. A browser-native interface with pure modules can demonstrate import/edit/render immediately and can later consume backend-produced score documents.

## Decision

Use plain browser modules for the initial editor and Node.js built-in tests for the portable core. Pin project metadata with a lockfile. No third-party runtime package is necessary yet. Use SVG for notation and a deterministic additive-harmonic/filtered-noise renderer for a declared approximate interpretation. Keep reference audio outside the renderer API.

## Evidence

On Node.js 22.17.0 / Windows, `npm run check` passes 11 semantic tests. `npm run fixtures` renders both studies and neutral baselines with no limited samples. Browser testing confirms the page loads, changing a gesture updates notation, undo restores its initial brightness, and playback starts with a progressing cursor. This is a software result; no human timbre-quality assessment has been collected.

## Consequences

The core works without downloading models. Analysis can be added without changing the renderer's trust boundary. Long renders currently block the main thread; introduce a worker before supporting long/dense excerpts. The current neutral baseline is not level-matched. Do not claim M2/M4 completion until remaining checks and perceptual gates are satisfied.
