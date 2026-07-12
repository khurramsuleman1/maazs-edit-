# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-13 by Codex (v2 checkpoint docs + build verification)
**Checkpoint:** v2 current-state snapshot.
**Phase:** Vite/Three.js single-wall runtime is the active storefront: Intro Home → Browse Home → bayless category/subcollection grids → product viewer.
**Shopify:** Admin data was pulled 2026-07-12: 506 products, 38 collections, PKR, 173/198 local storefront products matched.
**Operating mode:** Single operator. `docs/STATUS.md` carries the current session state.

---

## Source Of Truth

- `BA All DATA/All Multilayer Art-3/BAstore.blend` — scenes `BA_SINGLE_WALL_HOME` + `BA_PRODUCTS`.
- `docs/ARCHITECTURE.md` — geometric memory and web parity contract.
- `docs/ASSETS.md` — approval/export gate status.
- `src/data/shopifyVariants.js` — generated live Shopify variant mirror for matched local products; regenerate from Shopify rather than hand-editing.

## Now

- **V2 web state is in-site:** `intro` is the initial editorial wall, `home` is Browse Home with four grouped bayless product zones, and category/subcollection/viewer surfaces are bayless wall mounts with thick wall text. 3D Objects use black floating shelves in category grids and viewer.
- **Commerce data is aligned:** `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` and `docs/BA_PRODUCT_LOG.xlsx` exist. `catalog.js` mirrors live "from" prices for matched products, while `hud.js` computes selection prices from exact live variants plus site-side Wall/Digital Thickness and Material options.
- **Variant visuals are active:** product viewer size, thickness, and acrylic/wood material response now follow the selected option set. Default display size is the largest offered size; Wood + 2mm is the baseline.
- **Build status:** `npm run build` passes on 2026-07-13. Vite still warns that the main bundle is over 500 kB after minification, which is expected for the current un-split Three.js app.

## Next

1. Master Khurram reviews the v2 web flow locally: Intro Home → Browse Home → Wall/Digital/Layered/3D category grids → product viewer variants.
2. Claude brings `BAstore.blend` into parity using `docs/CLAUDE_BLENDER_D47_HANDOFF.md` and `docs/CLAUDE_BLENDER_D48_INTRO_HANDOFF.md`, then leaves the live review cameras active.
3. After visual approval, decide whether to push the site-side Thickness/Material options into Shopify, then regenerate `src/data/shopifyVariants.js`.
4. Optional performance pass: split the large runtime bundle and/or lazy-load heavy category assets after the v2 checkpoint.

## Blocked

- Blender D47/D48 parity is still waiting on live in-Blender review and approval.
- GitHub PR creation is unavailable in this environment because `gh` is not installed; plain `git` commit/tag/push can still be used if remote auth works.
