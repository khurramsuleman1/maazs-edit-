# Mobile UI Concepts — Vertical 3D Flow

Generated with imagegen on 2026-07-13 as mobile reference frames for arranging the 3D storefront.

## Current Status

- Runtime mobile WebGL uses a true 9:16 scissor viewport, including mapped raycasts.
- Home/Intro mobile framing was corrected on 2026-07-14: closer to the wall, no roof/header/track
  hardware visible, BA mark and Intro copy in frame, and only a narrow floor strip.
- Continue mobile work from `docs/CLAUDE_MOBILE_VIEW_HANDOFF.md`.
- Do not proceed past Home/Intro refinements until Master Khurram approves the mobile Home frame.

## Implementation Direction

- Mobile flow should read top-to-bottom. The camera, active section, and product arrays should move vertically rather than compressing the desktop left-to-right layout.
- Walls, light fixtures, floor, and atmosphere stay fixed. Do not create duplicate wall or light meshes for mobile views.
- Category and subcollection arrays should behave like vertical product elevators: active product centered, previous/next products above and below.
- Camera should settle into the destination view before products or UI appear.
- Product details, cart, and checkout should use bottom sheets so the selected 3D product remains visible above the commerce UI.
- Generated products, prices, and some labels are placeholders. Use real `catalog.js`, Shopify variant data, PKR pricing, and current Black Aesthetics product assets in implementation.

## Frames

- `01-mobile-intro-home.png` — Intro Home vertical logo/text/action path.
- `02-mobile-gallery-vertical-flow.png` — Gallery View with Wall/Digital/Layered/3D sections stacked vertically.
- `03-mobile-category-layered-art-vertical-array.png` — Category view with vertical Layered Art product array.
- `04-mobile-subcollection-wall-art-vertical-array.png` — Subcollection view with active wall art centered and neighboring products above/below.
- `05-mobile-product-viewer-bottom-sheet.png` — Product viewer with artwork above and details/actions in a bottom sheet.
- `06-mobile-search-vertical-results-layout-only.png` — Search overlay layout only; imagegen invented placeholder products.
- `07-mobile-cart-bottom-sheet-layout-only.png` — Cart bottom-sheet layout only; imagegen invented a placeholder product.
- `08-mobile-checkout-details.png` — Checkout Details step with product visible above.
- `09-mobile-checkout-payment-confirm.png` — Payment/Confirm direction with stacked manual/Shopify payment choices.
