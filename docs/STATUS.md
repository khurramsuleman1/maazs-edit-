# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-12 by Codex (D47 bayless Home revision locked)
**Phase:** Vite/Three.js single-wall runtime live at `http://localhost:5173/`; `BAstore.blend` remains the source of truth for geometry, materials, lighting intent, and exported layer vectors.
**Shopify:** ✅ Admin connected via MCP — Black Aesthetics, PKR, Basic plan.
**Operating mode:** Single operator. `docs/STATUS.md` carries the current session state.

---

## ⭐ THE SOURCE OF TRUTH

- **`BA All DATA/All Multilayer Art-3/BAstore.blend`** — scenes `BA_SINGLE_WALL_HOME` (gallery states) + `BA_PRODUCTS` (product library).
- **`docs/ARCHITECTURE.md`** — geometric memory + web parity contract. Read before touching scene or web layout.
- **AGENTS.md §6 "Blender→web AESTHETIC PARITY"** — how the site must look (D36/D37/D38).

## ▶ Now

- **D47 HOME REVISION — IMPORTANT:** saved the approved reference as
  `docs/inspiration-references/home-view-revision-bayless-v1.png` (SHA-256
  `b3859271f289cdbb08b484c7b8bde60b092dea77512638bcd44277eefe4323df`). Home only will become
  four bayless product zones; hovering a zone lifts/enlarges the whole group and highlights its
  matching bottom-nav item. Category/subcollection/viewer bays remain unchanged. Required look:
  warm textured plaster, balanced light on the logo side, rich dark digital prints, and readable
  black sculpture highlights. Blender collection `BA_HOME_D47_STAGED` is now **STAGED — awaiting
  in-Blender review**, framed through `BA_D47_HOME_REVIEW_CAMERA`; web Home remains unchanged until
  Master Khurram says "approved".

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
11. **Category scroll + mobile search polish DONE (2026-07-11):** collection mode now has explicit
    left/right arrow controls, drag-to-scroll on the 3D canvas, and ArrowLeft/ArrowRight keyboard
    scrolling; wheel scrolling uses the same clamp/camera/grid update path. Mobile search is clamped
    between the top controls and bottom dock so the input stays inside the viewport. `npm run build`
    passes. Headless Playwright confirmed the app/HUD load; full category interaction scripts timed
    out while waiting on heavy category asset work, so final visual feel should be reviewed live.
12. **Subcollection-first browsing DONE (D43, 2026-07-11):** Wall Art now opens through 8 niche
    bays (Animals, Anime/Manga, Comics & Heroes, Minimalistic, Personalities, Movies & Pop, Cars,
    Cultural Arts) and Digital Art opens through 6 niche bays (Anime/Naruto, Comics & Movies,
    Stained/Classical, Cultural Arts, Cars & Sports, Smoking Lady). Selecting a niche swaps the
    moving shelf to only that niche's products, keeping object count low. The hero bay stays fixed;
    the product/niche track moves left under drag/wheel/arrows/keyboard and virtualizes/disappears
    at the hero-bay boundary. Hovered track bays detach/enlarge with an additive warm focus pool
    (no real spotlights, preserving D41). `npm run build` passes; headless smoke saw controls
    visible and no console errors, but synthetic niche clicking was not visually reliable in
    headless, so live Browser review is still needed.
13. **Array edge-mask polish DONE (2026-07-11):** moving shelf bays remain full-size at the initial
    first column, begin shrinking only after scrolling toward the hero bay's right wall, become
    non-interactive while tiny, disappear before collision, and grow back as they re-enter from
    either edge. Hover enlargement/lift now affects only the product display inside the bay, not
    the bay frame. This keeps the hero bay visually clean while preserving drag/wheel/arrow scrolling.
14. **Live Shopify product alignment task created:** no per-product live Shopify mapping/export was
    found in the workspace beyond `docs/CATALOG.md` collection structure. Added
    `docs/SHOPIFY_PRODUCT_ALIGNMENT_TASK.md` for Claude/Shopify MCP to generate
    `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` with collection order, product handles, variant IDs,
    local asset matches, and unmatched lists before launch checkout wiring.
15. **Product-only state transitions DONE (D44-D46, 2026-07-11):** bay frames no longer travel or
    deform. The selected product detaches from its old recess, outgoing bays retreat in place, an
    empty destination bay spawns, and the same uniformly scaled product lands inside before the
    destination copy takes over. Camera movement starts after landing; arrays stagger in; viewer
    commerce UI waits for the scene. Real elapsed time drives the sequence, so heavy SVG/STL loads
    cannot freeze it or show a stale product beneath a new bay label.
16. **Full view QA DONE (2026-07-11):** Browser checked desktop 1440x900 and mobile 390x844 across
    Home, Wall Art/Digital niche arrays, selected Animals products, Layered direct products, 3D
    direct products, product viewer, and angled/frontal drag states. Desktop angled camera now keeps
    the left heading; desktop frontal shows the complete hero plus all eight Wall Art niches with no
    dead left void; mobile frontal intentionally prioritizes a dense array. Small procedural 3D
    previews preserve a reduced base scale through hover for jamb clearance. All checked states had
    zero console errors.

## ⏭ Next

1. Master Khurram reviews `BA_HOME_D47_STAGED` live in Blender through
   `BA_D47_HOME_REVIEW_CAMERA` and either requests changes or says "approved".
2. **Only after approval:** implement four zone hit groups, zone-only hover lift/enlarge, and
   synchronized bottom-nav highlighting; keep all non-Home bay views unchanged.
3. Rebalance web Home lighting/texture parity to D47: brighter logo side, richer plaster grain,
   controlled highlights, and digital poster texture/color-space corrections.
4. Master Khurram reviews the current live prefab transitions and subcollection/niche browsing flow at `http://localhost:5173/`;
   if approved, replace
   placeholder product URLs/options with real Shopify Storefront handles, variant IDs, availability,
   and checkout URL construction per `ba_spec_v2.md §13`.
5. Optional catalog polish: some of the 95 new Wall Art pieces are alt versions ("cat-1", "Wolf-1",
   "Geometric Set Variant 2-4") — curate/rename and set real prices/variants as desired.
6. Claude/Shopify MCP should generate `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` from live Shopify using
   `docs/SHOPIFY_PRODUCT_ALIGNMENT_TASK.md`; then Codex can align local products/subcollections to
   live collection names, sort order, handles, prices, variants, and checkout IDs.
7. Wire Shopify Storefront data/checkout only after the visual flow is approved and the alignment
   file exists.
8. Confirm `npm run build` on the mac before deploy; latest local build passes.

## ⛔ Blocked

- Live Shopify checkout, Storefront token wiring, deployment, and domain work need explicit approval.

## 📌 Notes

- Product spec: `ba_spec_v2.md` (historical; STATUS + ARCHITECTURE win on conflict).
- Catalog data: `docs/CATALOG.md` (37 Shopify collections; 4 active nav categories per D26).
- Asset gate: `docs/ASSETS.md`. Decimated STLs/poster images are product DATA, not gated assets (AGENTS §2, D38).
- Blender MCP notes: `docs/MCP_CONNECTION_NOTES.md`. This session: `mcp__Blender__execute_blender_code` works; headless jobs must spawn with `--factory-startup` (default startup crashed on macOS preview job).
