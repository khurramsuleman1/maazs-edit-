# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-23 by Codex (D67/D68 live; GitHub authenticated and release branch prepared)
**Checkpoint:** v2 current-state snapshot.
**Phase:** Vite/Three.js single-wall storefront: Intro → Gallery View → category/collection product rings → viewer/Custom Studio.
**Shopify:** Admin data pulled 2026-07-12: 506 products, 38 collections, PKR, 173/198 local storefront products matched.
**Operating mode:** Single operator. `docs/STATUS.md` carries session state.

---

## Source Of Truth

- `BA All DATA/All Multilayer Art-3/BAstore.blend` — Blender scenes `BA_SINGLE_WALL_HOME` + `BA_PRODUCTS`.
- `docs/ARCHITECTURE.md` — geometric and runtime parity contract.
- `docs/ASSETS.md` — approval/export gate status.
- `src/data/shopifyVariants.js` — generated live Shopify variant mirror; regenerate rather than hand-edit.

## Now

- **D64/D65 are live on the public phone-test site:** the shell contains one 18×9.2 plaster back wall and no floor. “All niches” and its panel are removed. Mobile transitions hide outgoing pieces first, move/refit the exact same product Object3D when it survives the state change, move the camera after landing, then reveal destination pieces and UI sequentially. Product-array neighbours build at a paced rate, sit farther outward at lower scale, and only the active DOM plaque is shown.
- **D66 lighting/material correction is live:** focused wall pools are 35% wider with substantially lower center intensity. Wall Art, default black objects, and the Matte Black viewer variant use neutral `#000000`, high roughness, zero metalness, and restrained specular response so warm lights cannot lift them brown/grey.
- **D67 refinement is published:** portrait Gallery View alternates complete category sections right/left/right/left. Each label sits across the camera axis from its piece at the same vertical center, so each row is an unambiguous text/product pair. Wall Art, the panther, and its shelf reveal around their own fixed final wall pivots; the generic destination reveal no longer overwrites the Wall Art zone's portrait scale. Each piece finishes before its matching UI appears, and only then does the next piece spawn. Collection arrays retain their lower ring controls, while product-array arrows flank the centered product and its active plaque sits directly below it.
- **D68 is published:** mobile final-product arrays and the viewer share camera `(0.9, 1.66, 4.7)`, look center `(0.9, 1.66, 0)`, mount center `(0.9, 1.62, 0.18)`, initial product footprint, and 3D shelf footprint. Opening/returning from a viewer preserves the selected Object3D's transform; only neighbours and viewer controls change.
- **Verification passed locally:** `npm run build`; D67 screenshot-based reveal-in-motion QA at 390×844 and settled/round-trip QA at 430×932; D68 frame-by-frame Layered Art handoff at 390×844 plus real-STL/shelf handoff at 430×932; selected product size/center remained unchanged and zero console errors were recorded. The 240 generated deployment files matched the prepared D67/D68 source checksums. Vite still gives the expected >500 kB main-chunk warning for the unsplit Three.js bundle.
- **Public phone test now points to the D67/D68 local build:** `https://black-aesthetics-3d-test.chaosstudios.chatgpt.site`. Sites reports the corrected client-layout deployment as succeeded. An initial root-layout package briefly returned 404 during validation and was immediately replaced. Shopify, GoDaddy DNS, and `blackaestheticspk.com` were not changed.
- **Local-server diagnosis:** the Vite project is healthy and starts at `http://localhost:5173/`; the former link stopped responding because no `npm run dev` process remained after the prior publishing teardown, not because the source or dependencies broke.
- **Current commerce remains in-site:** Shopify-matched variant pricing, product/material/color options, Wall Color visualization, Cart/Buy staged checkout, WhatsApp/COD handoff, and category-specific Custom Studio entries.
- **Asset gate unchanged:** no new Blender-authored asset was created or wired in this pass; existing product/SVG/STL data was reused.

## Next

1. Test the updated public URL on the reported phones, especially the D67 Gallery sequence and D68 stationary product-to-viewer handoff.
2. After the real-phone experience is approved, connect `3d.blackaestheticspk.com` and add its link to the Shopify homepage/menu.
3. Decide the next Custom Studio input: reference-file preview, written brief, or both before WhatsApp quote handoff.
4. Optional performance pass: Web Workers/pre-generated geometry plus bundle splitting.
5. Complete and review Blender D47/D48 parity before exporting any newly authored asset.

## Blocked

- Direct post-publish page verification from this Mac is blocked by the Sites access layer (`403` / `Access Denied`) even though Sites reports the project access mode as public and the deployment as succeeded. Confirm the final experience from a real phone/browser.
- Blender D47/D48 parity is waiting on live in-Blender review and approval.
