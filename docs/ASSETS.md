# ASSETS — pipeline & gate status

> Every visual asset is tracked here. Update the row when an asset changes stage.
> Stages: `TODO → MODELING → RENDERED (awaiting approval) → APPROVED → EXPORTED → IN-SITE`
> HARD GATE: an asset may only pass `RENDERED → APPROVED` when Master Khurram says so.
> See AGENTS.md §2.

## Environment (one main GLB — ba_spec_v2 §12)
| Asset | Stage | Render | .blend | GLB | Notes |
|---|---|---|---|---|---|
| BA_GALLERY storefront environment | IN-SITE | `docs/review-renders/ba_gallery_framed_v7.png` | `BAstore.blend` scene `BA_GALLERY`, collection `BA_REAL_SCALE_LAYOUT` | `public/models/ba-gallery-approved.glb` | Approved by Master Khurram on 2026-06-24, exported from Blender, and loaded as the website home environment. Website uses the Blender geometry, but disables imported Blender lights and applies reference-driven web materials/lighting. |
| Concrete back wall | TODO | — | — | — | form-lines, aggregate texture |
| Floor (polished concrete) | TODO | — | — | — | faint reflection |
| BA logo engraving | TODO | — | — | — | recessed geometry, not texture |
| Tagline engraving | TODO | — | — | — | "Where beauty is etched into art" |
| Spotlight rigs | TODO | — | — | — | 2–3 key lights |
| Category plinths ×4 | TODO | — | — | — | one per category |
| Dust particle system | TODO | — | — | — | subtle, in light beams |

## Category hero objects — FIRST BUILD (4 GLBs, one per active nav category. D26)
| Asset | Stage | Render | .blend | GLB | Notes |
|---|---|---|---|---|---|
| Wall Art — laser-cut piece | TODO | — | master .blend ✓ | — | meshes already exist (extruded SVG); pick one as hero (D09) |
| Digital Art — poster panel | TODO | — | — | — | flat panel, artwork texture on one side (D10) |
| Layered Art — depth panel | TODO | — | — | — | true layered meshes |
| 3D ART — print model | TODO | — | — | — | from `BA All DATA/3D Print Models/` (D08); not wired until approved/exported. |

## Products (per-product GLBs)
| Asset | Stage | Render | .blend | GLB | Notes |
|---|---|---|---|---|---|
| Wall Art web SVG products | IN-SITE | — | — | — | Public SVGs are converted in-browser to 5mm extruded meshes. |
| Digital Art web poster products | IN-SITE | — | — | — | Public images are mapped onto single 3mm glossy acrylic/poster meshes. |
| Layered Art web products | IN-SITE | — | `BAstore.blend` (`BA_REAL_WOLF_L*`, `BA_LAYERED_BEAR_L*`, `BA_LAYERED_MANDALA_L*`, `BA_LAYERED_ECLIPSE_L*`) | `public/models/layered/{wolf-layered,bear-layered,mandala-layered,eclipse-mandala}.glb` | Real Blender layer mesh groups exported and loaded in web for category thumbnails + product viewer; web enforces front-detail → back-layer order and 3mm layer-thickness metadata. |

## Source material on hand (not yet processed)
- `2D Art All SVG/` — 148 SVGs (wall art / digital art candidates)
- `BA All DATA/` — 2D Art, 2D Art All SVG, 3D Print Models, Poster prints
- `black_aesthetics_..._3d_meshes.blend` — master Blender file (existing meshes)
- `LOGO Blackaesthetics.svg` — brand logo
