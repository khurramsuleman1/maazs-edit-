# Claude Blender Handoff — D47 Bayless Home

> Owner: Claude using Blender. Web implementation may proceed independently. Do not change the
> website from this task; this document is solely for bringing `BAstore.blend` into parity.

## Objective

Rebuild the Home state of scene `BA_SINGLE_WALL_HOME` to match the important reference:

`docs/inspiration-references/home-view-revision-bayless-v1.png`

The Home wall has no bays. It is one warm, textured product wall with four readable zones:
Wall Art, Digital Art, Layered Art, and 3D Art. Category, scroller/subcollection, and viewer bays
must remain untouched and available in their existing collections.

## Source File And Safety

- Work only in `BA All DATA/All Multilayer Art-3/BAstore.blend`.
- Scene: `BA_SINGLE_WALL_HOME`.
- Preserve `BA_SW_SCROLLER_PAGE`, viewer geometry, shared architecture, source product collections,
  object names, and existing cameras.
- Keep all D47 Home objects under `BA_HOME_D47_STAGED`; do not destructively edit product masters.
- Use linked or evaluated copies under four roots: `D47_ZONE_WALL_ART`,
  `D47_ZONE_DIGITAL_ART`, `D47_ZONE_LAYERED_ART`, `D47_ZONE_3D_ART`.
- Hide old Home bays only through collection visibility for Home review.
- Do not render. Review in the live material-preview/rendered viewport per D14.

## Composition Contract

- Logo: full Black Aesthetics wall mark at far left, fully lit and readable.
- Wall Art: large Elegant Horse Head around `(-3.55, 2.10)`, with a salon row of four smaller
  approved wall-art silhouettes below around x `-4.45, -3.78, -3.12, -2.52`.
- Digital Art: three staggered portrait poster sheets around `(-1.65, 1.92)`, `(-0.92, 1.90)`,
  and `(-0.18, 1.05)`. Preserve deep blacks and saturated print color.
- Layered Art: Layered Wolf hero around `(1.20, 1.88)`, with smaller mandala stacks near
  `(0.35, 2.62)` and `(2.15, 0.92)`.
- 3D Art: two thin matte-black floating shelves centered near x `3.75`, y `2.08` and `0.82`,
  width about `1.75`; arrange the approved panther and smaller print objects as balanced groups.
- Maintain breathing space between zones while filling the wall similarly to the reference.

## Materials And Lighting

- Warm tactile plaster with visible fine irregular relief; avoid a flat beige surface.
- Black art must retain edge separation and warm highlights without turning grey.
- Digital posters must use their final print textures as the front face and remain rich, not washed.
- Add balanced Home-only warm pools across the whole wall, especially the logo side.
- Keep light sources area-based if preserving D41; fixture meshes may be visible for reference
  parity, but do not reintroduce harsh spotlight behavior into non-Home states.
- Use `D47_MAT_BLACK_SCULPT`, `D47_MAT_SHELF_BLACK`, and `D47_MAT_LAYER_1..4` or improved successors
  scoped to the D47 collection so source product materials are not modified.

## Camera And Review

- Review camera: `BA_D47_HOME_REVIEW_CAMERA`, near `(-0.72, -12.2, 1.72)`, 31 mm, aimed near
  `(-0.72, -0.08, 1.72)`.
- Frame the complete logo and all four zones with balanced left/right margins.
- Verify no intersections, no dark logo corner, no clipped objects, and no bays visible.
- Save the `.blend`, set the review camera active, leave the viewport in material preview with
  scene lights/world enabled, then ask Master Khurram to inspect it live.
- Update `docs/ASSETS.md`, `docs/STATUS.md`, and `docs/CHANGELOG.md` with the actual Blender stage.

## Interaction Intent To Preserve In Object Structure

Each zone root must remain a clean parent so a future export can uniformly lift and scale the
entire zone on hover. Do not apply transforms in a way that destroys this grouping. The website
uses the same four category IDs: `wall-art`, `digital-art`, `layered-art`, `3d-objects`.
