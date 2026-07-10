# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-11 by Codex (next-step review)
**Phase:** Vite/Three.js single-wall runtime live at `http://localhost:5173/`; `BAstore.blend` remains the source of truth for geometry, materials, lighting intent, and exported layer vectors.
**Shopify:** ✅ Admin connected via MCP — Black Aesthetics, PKR, Basic plan.
**Operating mode:** Single operator. `docs/STATUS.md` carries the current session state.

---

## ⭐ THE SOURCE OF TRUTH

- **`BA All DATA/All Multilayer Art-3/BAstore.blend`** — scenes `BA_SINGLE_WALL_HOME` (gallery states) + `BA_PRODUCTS` (product library).
- **`docs/ARCHITECTURE.md`** — geometric memory + web parity contract. Read before touching scene or web layout.
- **AGENTS.md §6 "Blender→web AESTHETIC PARITY"** — how the site must look (D36/D37/D38).

## ▶ Now

0. **FULLY LIT ROOM (D41, 2026-07-03, BOTH Blender + web):** ZERO spotlights — all SPOT
   lights (track/product/big-bay) and fixture meshes deleted in Blender; all aimed spots +
   wall scallops removed on web. Light = warm world/ambient + cove + big area fills + bay
   warm pools (values in ARCHITECTURE §2/§4). Rail + stems stay; bay strips/pucks/underlights
   stay (furniture). Home cameras: Blender x −1.15, web (−1.05, 1.78, 9.65) — logo + all 4
   bays fully in frame. Wall logo renders via canvas-rasterized SVG (TextureLoader gave
   0-size). `BA_MAT_ASH_WOOD_DARKGREY` = natural noise-streak grain, web canvas matches.
   `BAstore.blend` saved; web build + home QA screenshot verified (PNGs deleted, D30).
   ⚠ Blender crashed once on a Cycles QA thumbnail of the full home state — do NOT run
   thumbnail/blocking renders on heavy states; review live in viewport only (D14/inv.11).
   Note: the Vite dev server runs from a Blender-spawned process (dies with Blender);
   restart with `npm run dev` if the site stops responding.

1. **Render-parity lighting/texture pass done (D37):** all web colors now derived from Blender
   linear values → sRGB (plaster #c0aa89, bay gray #cecdc9, ash #424242–#6a6a6a, floor #5f4632,
   warm key #ffddb3, gold emission #ffce90, black wood #302c29, wolf layers #272727→#bcbcbc
   dark-FRONT like Blender). Render-target drama added: per-fixture wall scallops, recess puck +
   down-pool per bay, underlight wash, floor glow pools, lower/upper wall shade falloff; global
   light energy cut to render-target mood. Headless-Chrome QA vs
   `single-wall-home-front-render-target-web-16x9-v1.png` passes; QA PNGs deleted (D30).
2. **Digital Art = POSTER (D36):** one black sheet mesh per product, final print file textured on
   the FRONT FACE only, gold corner pins. No sticker/inset plane anymore.
3. **3D catalog COMPLETE (D38):** all 15 3D Object products load real STLs. 8 heavy sources
   decimated to ≤26k tris (≤1.3 MB) via `scripts/optimize_3d_prints.py` (headless Blender,
   sources untouched) into `public/products/3d/`. Home 3D bay = 2 in-recess shelves with real
   panther + fidget gear.
4. **Catalog — 198 products:** 148 Wall Art SVG (expanded 53→148 from the 2D-art library; all
   extrude clean), 30 Digital posters, 5 Layered SVG stacks, 15 3D Objects.
5. **Visual-QA fixes DONE (2026-07-04) — verified in Browser at
   `http://localhost:5173/` (desktop 16:10 + mobile), console clean, zero errors:**
   (a) Responsive home framing: `homeCameraZ(aspect,fovY)` dollies the home cam back at narrow
   landscape aspects so the BA logo + all 4 bays fit (16:10 no longer clips); portrait not
   force-fit (rail handles nav). (b) Category headings auto-fit: long titles scale to the ~0.95u
   gap so DIGITAL ART / 3D OBJECTS no longer collide with the big bay. (c) Mobile rail = horizontal
   scroll-snap strip with edge-fade affordance (all 5 categories reachable). (d) Mobile product
   panel = compact bottom sheet (was covering the top ~60%); product now visible.
   Files: `src/scene/GalleryScene.js` (a,b) + `src/styles.css` (c,d); `hud.js` untouched.
6. **UI direction selection boards (2026-07-04):** captured a no-HUD storefront plate from
   temporary `capture.html` (deleted before finish) and generated five deterministic mockups in
   `/tmp/ba-ui-options/`: `01-gallery-dock`, `02-boutique-commerce`, `03-curator-sidebar`,
   `04-command-dock`, `05-editorial-product`, plus `contact-sheet.png`. Follow-up: built-in
   imagegen direct edit of the exact screenshot was rejected, so five safer generic gallery-wall
   UI concept images were generated inline for mood/style exploration only, not as exact scene
   references.
7. **Gallery Dock view set (2026-07-04):** expanded the first UI style into six desktop mockups in
   `/tmp/ba-gallery-dock-views/`: `01-home-gallery-dock`, `02-collection-wall-art`,
   `03-search-overlay`, `04-product-detail-gallery`, `05-shopify-checkout-bridge`,
   `06-final-shopify-product-page`, plus `contact-sheet.png`. Product-detail boards include the
   Shopify contract: title/price/description, size/finish variants, quantity, Add to Cart, Buy with
   Shopify, and WhatsApp order path. Temporary `capture.html` was deleted, the temporary mockup
   server was stopped, and the Browser was restored to `http://localhost:5173/`.
8. **Floating UI implemented (2026-07-04):** translated the Gallery Dock direction into the live HUD
   in `src/ui/hud.js` + `src/styles.css`: top BA/search/bag/reset controls, bottom floating category
   dock visible across views, Shopify-ready product panel with size/finish options + quantity,
   Add to Cart, Buy with Shopify, WhatsApp ordering, and a floating bag/checkout bridge. `npm run
   build` passes; Browser QA passed at desktop 1440×900 and mobile 390×844 with clean console logs.
   QA screenshots are temporary in `/tmp/ba-floating-ui-qa/`.
9. **Shelf-front raised text labels (D42, 2026-07-07):** separate web nameplates/placards are
   superseded. `src/scene/GalleryScene.js` now mounts category/product names as shallow warm-gold
   TextGeometry extrusions directly on the vertical front face of each bay shelf, auto-split/scaled
   to fit home, big, grid, and viewer shelves. `npm run build` passes; Browser QA passed for home,
   Wall Art category, and mobile home with clean console logs. Browser DOM snapshot is currently
   broken in the Browser runtime, so QA used screenshots + targeted DOM reads instead.
10. **Layered-art fixes + grid virtualization DONE (2026-07-04, Claude), verified in Browser:**
    (a) `createLayeredSvgStack` now detects the solid full-canvas backing sheet (fewest path
    commands) and forces it to the BACK whatever its file index — fixes Motorcycle (its backing
    sheet sat mid-stack, hiding the detail cuts). (b) Eclipse Mandala now uses the warm-gold mandala
    palette (id check widened to include "eclipse"). (c) Category product grid is windowed:
    `updateCategoryGrid()`/`buildGridBay()`/`disposeGridBay()` build only the ~9 columns near the
    scroll centre and dispose far ones (per-mesh geometry + non-shared materials only; shared
    singletons + cached textures preserved), called on build/wheel/resize — the 148-product Wall Art
    grid loads fast + scrolls smoothly, virtualized-in products stay clickable. Wolf/Bear/Mandala
    unchanged. All in `src/scene/GalleryScene.js`; console clean.

## ⏭ Next

1. Master Khurram reviews the live floating UI at `http://localhost:5173/`; if approved, replace
   placeholder product URLs/options with real Shopify Storefront handles, variant IDs, availability,
   and checkout URL construction per `ba_spec_v2.md §13`.
2. Make category-grid horizontal scroll easier than the mouse wheel (drag/arrows); the mobile search
   input sits above the top edge on narrow viewports (QA find) — anchor it in view.
3. Optional catalog polish: some of the 95 new Wall Art pieces are alt versions ("cat-1", "Wolf-1",
   "Geometric Set Variant 2-4") — curate/rename and set real prices/variants as desired.
4. Wire Shopify Storefront data/checkout only after the visual flow is approved.
5. Confirm `npm run build` on the mac before deploy (sandbox can't — missing linux rollup binary; JS syntax-checked, dev clean).

## ⛔ Blocked

- Live Shopify checkout, Storefront token wiring, deployment, and domain work need explicit approval.

## 📌 Notes

- Product spec: `ba_spec_v2.md` (historical; STATUS + ARCHITECTURE win on conflict).
- Catalog data: `docs/CATALOG.md` (37 Shopify collections; 4 active nav categories per D26).
- Asset gate: `docs/ASSETS.md`. Decimated STLs/poster images are product DATA, not gated assets (AGENTS §2, D38).
- Blender MCP notes: `docs/MCP_CONNECTION_NOTES.md`. This session: `mcp__Blender__execute_blender_code` works; headless jobs must spawn with `--factory-startup` (default startup crashed on macOS preview job).
