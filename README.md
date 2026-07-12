# Black Aesthetics — 3D Virtual Store

A scroll-driven, cinematic 3D storefront for **blackaestheticspk.com**.
One continuous gallery wall in 3D — home, category scroller, and product viewer are
states of the same wall. Environment authored in Blender; site is a faithful Three.js
runtime of it; products from Shopify.

> **"Where beauty is etched into art."** · The wall is light. The art is black.

---

## Source of truth (v2 checkpoint 2026-07-13)

- **`BA All DATA/All Multilayer Art-3/BAstore.blend`** — scene `BA_SINGLE_WALL_HOME`
  (the gallery, HOME + SCROLLER states) + scene `BA_PRODUCTS` (real product mesh library).
- **`docs/ARCHITECTURE.md`** — the geometric memory and web parity contract.
- **`docs/SHOPIFY_PRODUCT_ALIGNMENT.json`** + **`src/data/shopifyVariants.js`** —
  current Shopify product/variant alignment for the in-site v2 storefront.

The active site is the v2 Vite/Three.js runtime: Intro Home, bayless Browse Home, bayless
category/subcollection grids, floating shelves for 3D Objects, and a variant-aware product viewer.

## For AI agents (Claude & Codex)

Read [`AGENTS.md`](./AGENTS.md) first, every session. The loop is:
**Read `docs/STATUS.md` → read `docs/ARCHITECTURE.md` before touching geometry →
ask if unclear → work → update STATUS (+ARCHITECTURE if geometry changed) + CHANGELOG.**

Hard gate: nothing reaches the website until Master Khurram approves it live in Blender
(`AGENTS.md §2`). QA render PNGs are deleted after viewing (D30).

## Layout

```
docs/       memory system (STATUS, ARCHITECTURE, DECISIONS, ASSETS, CHANGELOG, CATALOG)
public/     product images + logo (kept); models/ will hold approved GLB exports
assets/     approved glb exports, textures (to be repopulated)
BA All DATA/, 2D Art All SVG/   source art + BAstore.blend (do not move)
```

Run locally with `npm run dev`; verify production output with `npm run build`.
