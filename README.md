# Black Aesthetics — Live Website

This repository publishes only the live Black Aesthetics 3D storefront.

- `WEBSITE/` contains the complete deployable Vite/Three.js website.
- `AI_WORKSPACE/` exists only in the owner's local workspace. It contains agent memory,
  source art, Blender files, workbench tools, and unused assets, and is intentionally
  excluded from Git.

Run locally:

```bash
cd WEBSITE
npm install
npm run dev
```

Build the production site with `npm run build` from `WEBSITE/`.
