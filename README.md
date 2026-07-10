# Black Aesthetics — 3D Virtual Store

A scroll-driven, cinematic 3D storefront for **blackaestheticspk.com**.
One continuous gallery wall in 3D — home, category scroller, and product viewer are
states of the same wall. Environment authored in Blender; site is a faithful Three.js
runtime of it; products from Shopify.

> **"Where beauty is etched into art."** · The wall is light. The art is black.

---

## Source of truth (project reset 2026-07-03)

- **`BA All DATA/All Multilayer Art-3/BAstore.blend`** — scene `BA_SINGLE_WALL_HOME`
  (the gallery, HOME + SCROLLER states) + scene `BA_PRODUCTS` (real product mesh library).
- **`docs/ARCHITECTURE.md`** — the geometric memory: coordinates, bay anatomy laws,
  materials, invariants. It is the layout contract for both Blender and the web code.

The previous website, old gallery scenes, and old blends were deleted. The site gets
rebuilt fresh from the approved Blender construct.

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

Website code (`src/`, Vite config) gets scaffolded fresh when the rebuild starts —
direction in `docs/STATUS.md §WEBSITE DIRECTION`.
