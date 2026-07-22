# Black Aesthetics Workspace Contract

This repository has two major folders:

- `WEBSITE/` — the only Git-published product surface and the complete live website.
- `AI_WORKSPACE/` — local-only agent memory, source art, Blender files, workbench tools,
  and unused assets. It is intentionally ignored by Git.

At the start of every session, if the local AI workspace exists:

1. Read `AI_WORKSPACE/AGENTS.md`.
2. Read `AI_WORKSPACE/docs/STATUS.md`.
3. Use `AI_WORKSPACE/docs/DECISIONS.md`, `ARCHITECTURE.md`, and `ASSETS.md` as needed.

Before finishing any meaningful session, update `AI_WORKSPACE/docs/STATUS.md` and append
one line to `AI_WORKSPACE/docs/CHANGELOG.md`. Never stage or commit `AI_WORKSPACE/`.

Website commands run from `WEBSITE/` (`npm install`, `npm run dev`, `npm run build`).
Keep secrets out of Git and preserve the existing Vite/Three.js architecture unless the
task explicitly changes it.
