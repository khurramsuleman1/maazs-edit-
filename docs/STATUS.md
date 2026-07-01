# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-02 by Codex (local git repo prepared; initial website commit ready/pushed once remote exists)
**Phase:** 1 — Pipeline test: real products in Blender + wired into the website
**Shopify:** ✅ Admin connected via MCP — Black Aesthetics, PKR, Basic plan.
**Operating mode:** Unified single operator (Claude+Codex are one worker, never concurrent). No
Blender lock / file claims anymore — see AGENTS.md §0.

---

## ▶ Now — APPROVED BLENDER GALLERY IS IN THE WEBSITE
**Scene `BA_GALLERY`** in **`BAstore.blend`** (renamed from All Multilayer Art.blend), collection
`BA_REAL_SCALE_LAYOUT`. **Approved by Master Khurram on 2026-06-24** and cleared to drive the website
environment. Current build:

- **Walls (faceted, 8ft / 2.4384m, 6in thick):** center `0°`; inner display walls `±15°`; outer display
  walls `±30°`; side returns `±90°` (perpendicular to center → enclosed room). Edges connected.
  Warm beige plaster (noise-bump) material. Dark skirting (`BA_REAL_SKIRTING_*`) along every wall base.
- **Floor + roof:** wood slabs rebuilt to the exact wall-edge footprint `x[-3.07,3.07] y[-0.29,2.75]`
  (non-reflective). Roof bottom flush with wall tops. Floating **false-ceiling** panel + continuous warm
  **perimeter cove LED** following the floor plan.
- **Displays (each on its wall + matching un-mirrored bold label at z1.74):**
  Wall Art = **horse-head SVG** 8mm black wood · Digital = **2×3ft 5mm acrylic** (ironman image) ·
  centre = **BA logo** 1in · Layered = **grey Wolf** (4 layers, dark→light gradient, 18mm spacing, shows
  depth) · **3D ART** = 6 dark-grey-wood 30×30cm 1in shelves staggered 2-column, each with a black sphere.
  Each art wall has a grey-wood ledge + warm under-light (viewing template).
- **Lighting:** broad soft diffuse fill + front fill + warm cove washes; soft per-art spotlights; **small
  individual spot per 3D shelf**. Warm world ambient.
- **Camera `BA_REAL_CAMERA`:** `(0, 7.8, 1.22)`, lens `44mm`, aimed `(0,0.55,1.08)` — tight framing on the
  display band, minimal top/bottom void.

- **Product arrays (staged hidden behind display walls):** `BA_WALLART_ARRAY` = 5 wall-art SVGs
  (Athena/Astronaut/Lion/Wolf/Elephant) extruded 8mm black wood, queued behind the horse display;
  `BA_LAYERED_ARRAY` = Bear + Mandala + Eclipse-Mandala, each a correctly-ordered grouped layer stack
  (18 layer objects), queued behind the Wolf. Digital array not built (kept as single piece per instruction).
  These complete the catalog products for Wall Art & Layered Art, ready to cycle to the front.

Latest preview: `docs/review-renders/ba_gallery_framed_v7.png`. Saved and approved.

**Website sync verified:** active nav is four categories only (Wall Art, Digital Art, Layered Art,
3D ART). Apparel is removed from active navigation. The home environment loads the actual approved
Blender export at `public/models/ba-gallery-approved.glb` via `GLTFLoader`, with imported geometry,
labels, display products, shelves, and BA logo. Imported Blender lights are disabled in web; `environment.js`
overrides the GLB materials/lights toward the approved reference images: warmer cove/spot contrast,
darker roof/ceiling, richer plaster/floor texture, darker polished floor, black fixtures/products, and a
code-native warm light rig.

**Browsing flow (re-enabled 2026-06-25 — Claude).** Three modes: `home` → `category` → `product`.
- `home`: clean static composition. Hovering a category (rail or wall) shows only the gold highlight
  frame + a gentle camera lean — no more translucent ghost-display double image. Camera nudged up
  (HOME_CAMERA y1.16 / look y1.06) to centre the display band.
- `category`: clicking a category opens its **collection** as a floating array staged in front of the
  **right display wall** (`RIGHT_STAGE_CENTER ~x1.62`); products animate up from near-zero scale
  (spec §10), camera pans to `RIGHT_STAGE_CAMERA`, home zones/highlights fade out. Filter strip rebuilds
  the array. `createCollectionStage()` replaced the old wall-anchored `createProductWall()`.
- `product`: clicking a collection product (or a search result) opens the product viewer on the right
  wall (`RIGHT_WALL_VIEWER`, unchanged), room stays visible, rotate/layers/light/reset controls work.
- `back` cycles product → collection → home; rail highlights the active collection.

**CSS/visual fixes (2026-06-25):** home intro copy was permanently hidden by a base `display:none` rule
(now shows); home copy + category `.intro` were dark-on-dark (now light/gold for contrast); collection
panel eyebrow now reads "Collection".

**Home matched to Blender (2026-06-25 — Claude, from LIVE BAstore.blend values).** The web home view now
replicates `BA_REAL_CAMERA`: GLB import maps Blender→web as `web = (-1.28·Bx, 1.28·Bz, 1.28·By)`, giving
HOME camera `(0,1.56,9.98)` looking `(0,1.38,0.70)`; camera **horizontal** FOV is locked to the 44mm lens
(44.5°, computed per-aspect in `applyBlenderFov()`, clamped 24–46°, re-applied on resize). This fixes the
old too-wide 47° framing that shrank the walls and exposed a huge grey floor + black ceiling band. Floor
materials now match Blender `BA_MAT_WOOD_FLOOR` (matte warm wood, albedo ~0.28/0.18/0.10, roughness ~0.5,
near-zero metalness, low env reflection) instead of the chrome-grey mirror; ceiling warmed; floor
reflection overlay cut to 0.06; fog pushed to 16–34 so the room isn't hazed at the new distance. Category
hover/click hit-boxes are now anchored to the approved-GLB display positions (same as the gold highlight
frames) so 3D wall selection lands on the visible art. Right-stage collection/product cameras re-tuned for
the narrower FOV. Reference target: `docs/review-renders/ba_gallery_framed_v7.png`.

**Verification status:** `node --check` passes on all edited modules. Full `npm run build` + browser
screenshot QA is PENDING on a non-sandbox machine — this session's Linux sandbox lacks the platform
rollup/esbuild native binaries and npm registry access, so it cannot bundle or render. Run `npm run dev`
locally to view; flag anything off about the right-stage camera framing or product spacing for tuning.

**Reference render QA:** Home render now uses approved-GLB object centers for hover/highlight anchors.
The Layered Art Wolf display is centered on its approved wall/shelf using a synchronous layered image-stack
fallback from `public/products/layered/wolf.png`; the imported hidden Wolf bounds remain the placement
anchor while the GLB normalization issue is deferred. Latest QA screenshots for this pass are in `/tmp`
(`ba-home-fixed.png`, `ba-home-layered-hover.png`) and should be copied into `docs/qa-screenshots/` only
when Master Khurram wants a retained record. Remaining visual gap vs `docs/inspiration-references/4cat-*.png`:
Wolf texture cutout still reads as a gray-backed source image rather than premium physical layers, floor
reflection realism, richer wall/roof/lights/material attraction, and the faint imported-wall horizontal seam.

**Thickness / product contracts in web:** Wall Art SVG extrusions = **5mm**; Digital Art poster/acrylic mesh =
**3mm**; Layered Art now uses real Blender layer groups exported as GLBs for Bear, Eclipse Mandala,
Mandala, and Wolf (`public/models/layered/*.glb`). The web viewer normalizes those meshes, enforces
front-detail → back-layer order with **3mm layer-thickness** metadata, and uses the layer animation control
on the actual mesh layers instead of repeated PNG planes.

**File hygiene:** master .blend cleaned earlier (278 dead objects + 8 trash collections purged, 123→110MB).
`Scene` keeps the 8 real product source collections. Pre-cleanup backup: `…/All Multilayer Art.PRE-CLEANUP-backup.blend`.

**Git repo:** local repository is on `main`; `.gitignore` excludes secrets, build output, node_modules,
heavy source art folders, and raw `.blend` files. Remote GitHub repo still needs to be created/attached
because no GitHub CLI is installed in this environment.

## ✅ Done earlier
**Website real products (D23/D26).** `src/data/storefront.js` holds the active real test-set catalog
(Wall Art ×5, Digital ×5, Layered ×4, 3D ART ×5) with PKR prices and image paths. Real artwork lives in
`public/products/{wall-art,digital,layered}`. 3D ART remains procedural until approved product GLBs exist.

**Pipeline-test Blender file:** `BA All DATA/All Multilayer Art-3/All Multilayer Art.blend`, scene
`Scene`, collections `BA_TEST_WALLART` (5 SVG laser-cut), `BA_TEST_DIGITAL` (5 posters), `BA_TEST_3DOBJ`
(2 real STLs + cube/sphere/cone placeholders), plus 5 native layered products WITH real layer geometry.
Camera `BA_TEST_CAM`. ✅ Saved.

## ⏳ Awaiting Master Khurram
1. Review the website (`npm run dev`) and tweak the flow/UI as desired.
2. **3D ART product GLBs**: web shows procedural dummies; approve/export real Blender objects before wiring.

## ⏭ Next (priority order)
1. **Visual QA locally** (`npm run dev`) — sandbox can't bundle (mac-only native binaries + no registry).
   (a) Compare home framing against `docs/review-renders/ba_gallery_framed_v7.png`; if walls clip or float,
   nudge `HOME_CAMERA`/`BLENDER_HFOV_DEG` in `environment.js`. (b) Confirm the warm matte floor reads right
   (not grey, not over-glossy). (c) Confirm right-stage collection grid + product-viewer framing; tune
   `RIGHT_STAGE_*` / `PRODUCT_CAMERA_OFFSET` if products sit too high/low/cramped.
2. Continue render QA against `docs/inspiration-references/4cat-*.png`: improve roof/lights/material
   attraction, remove the remaining faint wall seam, and push floor reflections/shadows closer to the reference.
3. Revisit the Wolf/layered GLB normalization so the real `wolf-layered.glb` can replace the temporary
   texture-stack fallback cleanly.
4. Optimize layered product GLBs after visual approval; `mandala-layered.glb` is currently large (~22MB).
5. Replace procedural 3D ART shapes with approved GLBs (gate, AGENTS.md §2).
6. Public **Storefront API** token → `.env` for live product data (optional; catalog is static for now).

## ⛔ Blocked
- Real 3D ART product GLBs on the site → blocked until approved in Blender (gate).
- Master .blend full catalog → heavy STLs crashed Blender; use the lightweight test file for now.
- Current Codex Blender MCP transport closed after fixing a protocol mismatch. Blender itself is healthy on
  `127.0.0.1:9876` using Blender 5.1 lab MCP null-delimited `execute` packets; restart/reload the Codex
  Blender MCP connector so it respawns with the patched wrapper.

## 📂 Catalog
- `docs/CATALOG.md` = all 37 Shopify collections. Active design now uses 4 nav categories per D26
  (Wall Art, Digital Art, Layered Art, 3D ART); Apparel catalog data remains but is out of the
  current visual/navigation design.

## 📌 Notes
- Spec is `ba_spec_v2.md` — link to its sections, don't restate.
- Blender MCP recovery notes: `docs/MCP_CONNECTION_NOTES.md`.
- Inspiration direction in `docs/inspiration-references/`: a 3D world with physical products, not flat cards.
- Locked flow + asset strategy: see CHANGELOG 2026-06-23 (pending a DECISIONS entry).
