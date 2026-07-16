# Claude Handoff — Mobile 9:16 Web View

> Owner: Claude or next web agent. This is website runtime work, not Blender asset authoring.
> Read `AGENTS.md`, `docs/STATUS.md`, `docs/ARCHITECTURE.md`, and
> `docs/ui-concepts/mobile/README.md` before editing.

## Objective

Refine the mobile storefront one view at a time while preserving the current desktop experience.
Master Khurram asked to start with **Home/Intro only**; do not move on to Gallery View, category,
subcollection, viewer, cart, or checkout mobile refinements until he approves the mobile Home frame.

## Current Mobile State

- Mobile runtime renders WebGL through a true 9:16 scissor viewport; raycasts map to that frame.
- The temporary top `Mobile` / `Desktop` preview toggle is present for local review.
- Full portrait pass completed 2026-07-14 (Claude, on Master Khurram's "fix the mobile view" direction):
  - **Intro:** camera (−4, 1.5, 4.35); logo scale 0.55 at y 2.08 (full circle in frame, clear of HUD);
    copy group at (−4, 1.02) scale 0.35 with each line re-centred via `setIntroLayout`;
    hanging fixture cones hidden in portrait (`atmosphereFixtures` toggle in `resize()`).
  - **Gallery View:** four labelled vertical hero sections at x −4 (`applyHomeLayout` placements +
    `homeZoneLabels`); non-hero pieces hidden in portrait; wall logo shrinks away via portrait
    `galleryLogoPlacement`.
  - **Category:** camera (0.9, 1.66, 4.7); centred 3D title at y 2.94 (body copy desktop-only);
    hero bay at y 2.05; single-tile scroll lane `MOBILE_GRID` (startY 0.55, stepY 0.85,
    edgeFade 0.35); scroll steps one slot.
  - **Viewer:** camera (0, 1.82, 4.4); bay y 2.58; no 3D wall label on portrait (name is in the
    bottom-sheet panel); product sits above the sheet.
- Dev-only `window.__gallery` hook in `main.js` for browser-console QA.
- `npm run build` was NOT run this session (Linux sandbox vs macOS node_modules) — run on host.

## Reference Images

Use these files as visual references for mobile layout. They are concept references, not data
sources. Use real `catalog.js`, `src/data/shopifyVariants.js`, current product assets, and PKR
prices in implementation.

| View | Reference |
|---|---|
| Intro / Home | `docs/ui-concepts/mobile/01-mobile-intro-home.png` |
| Gallery View vertical sections | `docs/ui-concepts/mobile/02-mobile-gallery-vertical-flow.png` |
| Category vertical array | `docs/ui-concepts/mobile/03-mobile-category-layered-art-vertical-array.png` |
| Subcollection vertical array | `docs/ui-concepts/mobile/04-mobile-subcollection-wall-art-vertical-array.png` |
| Product viewer + bottom sheet | `docs/ui-concepts/mobile/05-mobile-product-viewer-bottom-sheet.png` |
| Search overlay layout | `docs/ui-concepts/mobile/06-mobile-search-vertical-results-layout-only.png` |
| Cart bottom sheet layout | `docs/ui-concepts/mobile/07-mobile-cart-bottom-sheet-layout-only.png` |
| Checkout details | `docs/ui-concepts/mobile/08-mobile-checkout-details.png` |
| Checkout payment / confirm | `docs/ui-concepts/mobile/09-mobile-checkout-payment-confirm.png` |

## Mobile Design Rules

- Mobile flow is top-to-bottom. Product arrays should move vertically, not squeeze desktop rows.
- Walls, floor, atmosphere, fixtures, and lights remain shared static scene objects. Do not create
  mobile duplicates.
- Camera must move into the destination position before destination products/UI appear.
- If leaving a view, hide outgoing content in sequence before moving camera or products.
- If selecting a category/product, move/scale the selected product first; move the camera after
  the product lands; reveal text/products one by one after the camera settles.
- Product details, cart, and checkout should be bottom sheets so the selected 3D product remains
  visible above the UI.
- Keep desktop camera paths, layout, and transition behavior unchanged unless Master Khurram
  explicitly asks for a desktop change.

## Work Order

1. ~~Refine Intro, Gallery View, category/subcollection arrays, and viewer framing~~ — done 2026-07-14
   (references `01`–`05`). Master Khurram reviews the full mobile flow at the local Vite URL.
2. Address his review notes view-by-view.
3. Optional next: mobile search overlay and cart sheet polish using layout-only references `06`–`09`
   (never copy their invented products/prices).
4. After each change, run `npm run build` on the host, check the real 390x844 viewport, update
   `docs/STATUS.md`, and append one line to `docs/CHANGELOG.md`.

## Files Most Likely To Touch

- `src/scene/GalleryScene.js` — mobile camera/view framing, 9:16 viewport, 3D layout and transitions.
- `src/ui/hud.js` — mobile view controls, bottom sheets, commerce flow.
- `src/styles.css` — responsive UI/bottom-sheet styling.
- `src/main.js` — preview toggle wiring if needed.

## Do Not Do

- Do not replace existing product data with generated concept labels, products, or prices.
- Do not introduce new Blender-authored GLB assets unless they pass the asset gate in `AGENTS.md §2`.
- Do not duplicate wall/light meshes for mobile.
- Do not continue beyond mobile Home/Intro until Master Khurram approves that frame.
