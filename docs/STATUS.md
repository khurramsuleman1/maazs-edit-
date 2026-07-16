# STATUS — live state of Black Aesthetics

> Source of truth. Always current. Read first, update before finishing.
> Keep it short — finished work moves to CHANGELOG, not here.

**Last updated:** 2026-07-16 by Codex (latest storefront version committed locally; GitHub push blocked by auth)
**Checkpoint:** v2 current-state snapshot.
**Phase:** Vite/Three.js single-wall runtime is the active storefront: Intro Home → Gallery View → bayless category/subcollection grids → product viewer.
**Shopify:** Admin data was pulled 2026-07-12: 506 products, 38 collections, PKR, 173/198 local storefront products matched.
**Operating mode:** Single operator. `docs/STATUS.md` carries the current session state.

---

## Source Of Truth

- `BA All DATA/All Multilayer Art-3/BAstore.blend` — scenes `BA_SINGLE_WALL_HOME` + `BA_PRODUCTS`.
- `docs/ARCHITECTURE.md` — geometric memory and web parity contract.
- `docs/ASSETS.md` — approval/export gate status.
- `docs/CLAUDE_MOBILE_VIEW_HANDOFF.md` — resume point for mobile 9:16 web-view refinement.
- `docs/ui-concepts/mobile/` — portrait reference images for mobile Home, Gallery, category, viewer, search, cart, and checkout.
- `src/data/shopifyVariants.js` — generated live Shopify variant mirror for matched local products; regenerate from Shopify rather than hand-editing.

## Now

- **V2 web state is in-site:** `intro` is the initial editorial wall, `home` is now labeled Gallery View with four grouped bayless product zones, and category/subcollection/viewer surfaces are bayless wall mounts with thick wall text. 3D Objects use black floating shelves in category grids and viewer.
- **Commerce data is aligned:** `docs/SHOPIFY_PRODUCT_ALIGNMENT.json` and `docs/BA_PRODUCT_LOG.xlsx` exist. `catalog.js` mirrors live "from" prices for matched products, while `hud.js` computes selection prices from exact live variants plus site-side Wall/Digital Thickness and Material options.
- **Variant visuals are active:** product viewer size, thickness, and acrylic/wood material response now follow the selected option set. Default display size is the largest offered size; Wood + 2mm is the baseline.
- **Interaction/performance animation is in-site:** category and subcollection selection now starts state changes immediately instead of awaiting asset prep; Home hover no longer triggers preloads; Intro starts an idle background asset prewarm; SVG/layer extrusion from cached text is deferred to idle work; pointer hover raycasts are frame-throttled. Static wall/floor/atmosphere/lights now live outside view groups and never duplicate or move. Transitions follow the locked sequence: outgoing content disappears first, selected product moves/scales into its destination, camera moves only after the product lands, then destination text and pieces reveal one by one. Intro → Gallery View uses the same BA wall-logo mesh moving into its gallery placement, hides Intro text line-by-line, reveals Gallery View products Wall Art → Digital → Layered → 3D one piece at a time, and keeps HUD controls hidden until animation completion.
- **Layered-art experience is active:** Eclipse Mandala and Motorcycle now use explicit back-to-front SVG layer order. Layered SVG stacks assemble one layer at a time from a clear camera-side z offset, the product panel exposes an Expand/Collapse Layers button in viewer mode, and product reveal animations now start forward between the camera and wall before latching back onto their wall positions. All wall/product display placements have additional z-clearance from the wall to avoid collisions. `npm run build` passes on 2026-07-13. Browser smoke passed Layered Art → Eclipse viewer with layer control; headless Chromium only reported WebGL driver performance warnings. Vite still warns that the main bundle is over 500 kB after minification, expected for the current un-split Three.js app.
- **Cinematic UI concepts are drafted:** fresh no-UI site renders and one UI concept per requested view live in `docs/ui-concepts/`: Intro, Gallery View, Category Grid, Subcollection Grid, Product Viewer, Search, Cart page, and Checkout page. Seven concepts used imagegen; Gallery View used a deterministic overlay fallback after imagegen rejected the base containing recognizable pop-culture product art. Search is layout-only because generated pricing text drifted from PKR.
- **Mobile vertical-flow concepts are drafted:** `docs/ui-concepts/mobile/` contains imagegen portrait references for Intro, Gallery View, Category, Subcollection, Product Viewer, Search, Cart, Checkout Details, and Payment/Confirm. Mobile implementation direction is top-to-bottom: camera/product arrays move vertically, active products center with previous/next above/below, wall/lights stay fixed, and commerce/search surfaces use overlays or bottom sheets. Search and Cart mobile frames are layout-only because imagegen invented placeholder products/text.
- **D55 mobile stage is implemented, QA'd, build-verified, and staged for Master Khurram's review:** portrait hides the entire gallery architecture and floats 3D products over a dark charcoal-grey backdrop with ALL text as floating DOM UI (`createMobileStage()` + `resize()` swap in `GalleryScene.js`; `.mobile-stage` DOM layer in `hud.js`/`styles.css`; `data-mobile` attr + `--mobile-frame-top/height` vars align with the letterboxed scissor on real phones). Visual QA passed 2026-07-14 in Chrome mobile preview on all views: Intro (gold BA + centred copy on charcoal), Gallery View (four header-ruled sections at 12/33/54/75% with one lit hero each), Category (COLLECTION eyebrow + title, glowing hero, wrapped name/price plaque, lane tile + plaque via `getMobileLaneItem()`), Viewer (lit product above the bottom sheet). Stage has its own key/fill/ambient lights so dark pieces read on charcoal; desktop verified unchanged; zero console errors. `npm run build` passes on 2026-07-16 with the expected >500 kB bundle warning. Remaining: Master Khurram's design verdict. Dev-only `window.__gallery` hook in `main.js` aids browser QA (hidden tabs never fire rAF — pump `g.animate()` manually).
- **Cart and Buy Now UI are refined in-site:** the top action is now Cart, the product panel uses secondary Add to Cart plus primary gold Buy Now, and commerce now runs as a staged BA checkout drawer: Cart → Details → Payment → Confirm. Buy Now opens at Details; Add to Cart opens at Cart with thumbnail, selected options, quantity, subtotal, and Keep Browsing. Shopify routes to the live product URL; WhatsApp/COD routes to manual order text. A temporary top Mobile/Desktop preview toggle changes HUD layout and camera aspect for fast responsive checks. `npm run build` passes; Browser smoke passed Product Viewer → Buy Now → Details → Payment → WhatsApp Confirm, Add to Cart → quantity increment, and Mobile/Desktop preview toggle. Vite still warns that the main bundle is over 500 kB after minification, expected for the current un-split Three.js app.

## Next

1. Start `npm run dev` when ready for local review, then Master Khurram reviews the staged cart/buy-now/checkout flow at the Vite URL.
2. Master Khurram reviews the QA'd D55 mobile stage at the Vite URL (Mobile toggle or narrow window); notes get applied view-by-view. Follow-ups continue via `docs/CLAUDE_MOBILE_VIEW_HANDOFF.md`.
3. Master Khurram reviews `docs/ui-concepts/generated/` and chooses which remaining cinematic desktop UI patterns to implement.
4. Master Khurram reviews the v2 web flow locally: Intro Home → Gallery View → Wall/Digital/Layered/3D category grids → product viewer variants and layered Expand/Collapse.
5. Claude brings `BAstore.blend` into parity using `docs/CLAUDE_BLENDER_D47_HANDOFF.md` and `docs/CLAUDE_BLENDER_D48_INTRO_HANDOFF.md`, then leaves the live review cameras active.
6. After visual approval, decide whether to push the site-side Thickness/Material options into Shopify, then regenerate `src/data/shopifyVariants.js`.
7. Optional next performance pass: move heavy SVG/STL geometry conversion into Web Workers or pre-generated GLB/JSON geometry assets, then split the large Three.js bundle.

## Blocked

- Blender D47/D48 parity is still waiting on live in-Blender review and approval.
- GitHub push is blocked in this environment until GitHub auth is restored: `git push origin main` fails with `could not read Username for 'https://github.com': Device not configured`; `gh` is not installed; SSH auth is denied. Local `main` contains the latest committed work and is ahead of `origin/main`.
