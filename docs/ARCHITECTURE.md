# ARCHITECTURE.md — The 3D Construct of the Black Aesthetics Gallery

> **This file is the geometric source of truth.** The scene it describes lives in
> `BA All DATA/All Multilayer Art-3/BAstore.blend`, scene **`BA_SINGLE_WALL_HOME`**.
> If the .blend and this file disagree, the .blend wins — then FIX THIS FILE.
> Update this file in the same session as ANY geometry change. Never regress from it.
>
> Approved direction: one continuous wall; home / scroller (category) / product viewer are
> **states of the same wall**, switched by camera + collection visibility (D27/D28).

---

## 1. Coordinate system & the LOGO ORIGIN

Blender world axes: **X = along the wall (right +)** · **Y = depth (viewer stands at −Y)** ·
**Z = up (floor = 0)**. Units = meters.

Named anchor — **LOGO_ORIGIN = (−5.25, −0.08, 1.55)**: center of the real BA logo mark on the
wall face (home state). To express any point relative to the logo: `rel = world − LOGO_ORIGIN`.

Key world planes (memorize these — everything mounts to them):

| Plane | Y | Rule |
|---|---|---|
| Wall center | 0.00 | wall slab is 0.16 thick |
| **WALL FACE** | **−0.08** | wall-mounted items (logo, labels, description text) back-face = **−0.081** |
| **RECESS BACK FACE** | **−0.18** | in-bay art back-face = **−0.1805** (recess panel 0.07 thick @ y −0.145) |
| Jamb/cap front | −0.365 | frame parts are centered y −0.215, 0.30 deep |
| Floor top | z 0.00 | dark wood slab below (z −0.09..0) |

**Flushness law: NOTHING floats.** Every mounted piece's true mesh bbox (measure via
evaluated `to_mesh()`, NOT curve bbox — SVG curves have stray bounds) is snapped to its plane.

## 2. Shared architecture (visible in every state) — collection `BA_SW_REAL_RATIO_REBUILD`

Wall runs x **−6.4 → 11.6** (18.0 m). Left edge fixed (home framing), right side exists for
the endless scroller.

| Element | Object(s) | Center (x,y,z) | Dim (x,y,z) |
|---|---|---|---|
| Plaster wall (light gray) | `BA_RR_ONE_CONTINUOUS_REAL_RATIO_PLASTER_WALL` | (2.6, 0, 1.8) | 18 × 0.16 × 3.6 |
| Black header band (roof fascia) | `BA_RR_DEEP_BLACK_HEADER_BAND` | (2.45, −0.22, 3.92) | 18.3 × 0.86 × 0.52 → bottom z 3.66 |
| Warm cove line | `BA_RR_CONTINUOUS_WARM_COVE_LINE` | (2.75, −0.105, 3.43) | 17.7 × 0.04 × 0.055, emissive gold |
| Track rail | `BA_RR_BLACK_TRACK_RAIL` | (2.975, −0.42, 3.30) | 17.25 × 0.06 × 0.06 |
| Rail mounting stems ×7 | `BA_RR_TRACK_STEM_00–06` | x = −5.2, −2.6, 0, 2.6, 5.2, 7.8, 10.4 · y −0.42 · z 3.48 | 0.02 × 0.02 × 0.36 (rail top 3.33 → header 3.66) |
| ~~Spot lights~~ — **NONE (D41, 2026-07-03): the scene has ZERO spotlights** — all track/product/big-bay SPOT lights and fixture meshes deleted | — | — | fully lit room: world (0.09, 0.075, 0.058), cove 400W, front fills 520W, bay warm pools 120W, logo pool 130W; rail + stems remain as architecture |
| Skirting top/bottom | `BA_RR_BLACK_SKIRTING_TOP/BOTTOM` | (2.6, −0.105, 0.22) / (2.6, −0.112, 0.065) | 18 × 0.07 × 0.16 / 18 × 0.08 × 0.09 |
| Floor | `BA_RR_DARK_WOOD_FLOOR_CONTINUOUS` | (2.75, −3.1, −0.045) | 17.7 × 6.2 × 0.09 |
| Plank seams ×10 long / ×14 short | `BA_RR_FLOOR_LONG_PLANK_SEAM_*`, `_SHORT_BREAK_*` | long: y −5.45 → −0.5 step 0.55, z 0.008 | 17.4 × 0.012 × 0.012, near-black |
| Plaster seams/marks | `BA_RR_SUBTLE_*` | verticals x −6.2, −4.35, −3, −1.65, −0.3, 1.05, 2.4, 3.75 | cosmetic, on wall face |
| Cove wash light | `BA_RR_LONG_COVE_WALL_WASH` | (2.6, −0.62, 3.25) rot_x 75° | AREA **320W** (1, 0.72, 0.45), size 12 |

General illumination (D41, 2026-07-03): FULLY LIT ROOM — world (0.09, 0.075, 0.058) ×1.0;
home/scroller front fills 520W; cove 400W; bay warm pools 120W; row washes 240/200W;
desc wash 90W. No spotlights anywhere; bay emissive strips/pucks/underlights are furniture.

Camera/render: res **1672×941 (16:9)**, Cycles, color mgmt **AgX / AgX-Punchy**.

## 3. Bay anatomy — THE FRAME BOX LAW (applies to every bay, any size)

A bay = a **closed black picture-frame box** around a recess:

- **Recess back panel** (= the bay's inner wall): w × 0.07 × h, center y −0.145 (front face
  −0.18), **light gray** (`BA_RR_bay_inner_gray`) so black art pops inside the black frame.
- **Jambs (L/R)** + **top cap**: 0.30 deep, centered y −0.215 (so they run from inside the wall
  −0.065 out to −0.365). Jamb thickness = small bays 0.07, home bays 0.14, big bay 0.16.
- **Bottom shelf** *(Master Khurram's correction — 2026-07-03)*: same width as frame outer
  (w + 2·jamb), **0.36 deep, centered y −0.26 → back edge INSIDE the wall (−0.44 … −0.08)**.
  The shelf CLOSES the frame box; it must never float in front of the wall.
- **Underlight** *(his correction)*: thin emissive strip at the **INNER bottom edge** —
  y = **−0.105** (against the wall face), z = just under the shelf's bottom face. It washes
  DOWN the wall below the bay. Never on top of or in front of the shelf.
- **Top light strip**: w·0.55 emissive strip tucked under the top cap inside the recess
  (y −0.26/−0.27, z = recess top − 0.02).
- **Shelf-front raised text (D42, replaces nameplates/placards)**: category/product names are
  shallow warm-gold vector/TextGeometry extrusions mounted directly on the shelf's vertical
  front face, centered within the shelf height and scaled to the bay's outer width. There is
  no separate black placard or freestanding nameplate mesh in the web runtime.

**Contrast law (corrected 2026-07-03): main wall WARM PLASTER (0.53, 0.40, 0.25) · frames +
fixtures BLACK · BAY INNER WALLS (recess backs) LIGHT GRAY (0.62, 0.61, 0.585, rough 0.85,
mat `BA_RR_bay_inner_gray`) · art BLACK** — black art reads against the pale recess interior
inside each black frame; the recess back is the gray canvas, NOT the main wall.

## 4. HOME state

Show: `BA_SW_RR_HOME_BAYS` + `BA_SW_REAL_PRODUCTS` + `BA_SW_REAL_LOGO`. Hide: `BA_SW_SCROLLER_PAGE`.
Camera **`BA_SW_HOME_FRONT_CAMERA_REVIEW`**: loc (**−1.15**, −10, 1.7), rot_x 90.17°, **31 mm**, shift_y 0
(x moved from −0.9 on 2026-07-03 so the logo fits fully with margin; web home camera matches at −1.05).

### 4.1 Four category bays (`BA_SW_RR_HOME_BAYS`, prefix `BA_RR_<CAT>_`)
Recess 1.46 w × 2.22 h, center z 1.745 (z 0.635..2.855). Jambs 0.14. Cap at z 2.93 (1.72 × 0.3 × 0.15).
Shelf 1.72 × 0.36 × 0.17 at (cx, −0.26, 0.485). Bay warm pool AREA 70W at (≈cx, −0.75, 2.05).
No product/category label is written on the back wall above the bays. Shelf-front raised text
extrusions carry the category/product labels.

| Bay | center x | Product (real mesh, in `BA_SW_REAL_PRODUCTS`) |
|---|---|---|
| WALL ART | −3.35 | `BA_SW_PROD_WALLART_HORSEHEAD` — blackwood horse-head SVG, 1.27 m wide, z 1.72, back flush −0.1805 |
| DIGITAL ART | −1.25 | `BA_SW_PROD_DIGITAL_IRONMAN` — 2×3 ft acrylic display-scaled 0.95 × 1.42 × 5 mm, z 1.70, flush |
| LAYERED ART | 0.85 | `BA_SW_PROD_WOLF_L1–L4` — real 4-layer stack, L4 back flush −0.1805, layers step 17 mm toward viewer, z 1.72 |
| 3D ART | 2.95 | 2 in-recess shelves (1.30 × 0.22 × 0.045 @ y −0.29, z 2.00 / 1.28) + `BA_SW_PROD_3D_PANTHER` (0.45 m STL, on top shelf) + `BA_SW_PROD_3D_FIDGET` (on mid shelf), both y −0.27 |

Product spots: DELETED (D41 — no spotlights). Bay warm pool AREA lights are 120W.
Front fill: AREA 10 × 2.5, **520W**, (−0.9, −7.0, 2.6) rot_x 75°.

### 4.2 Logo (`BA_SW_REAL_LOGO`)
`BA_SW_REAL_LOGO_MARK` = the REAL `LOGO Blackaesthetics.svg` (D21, 17 curves joined),
extrude 8 mm, **1.4 × 1.4 m roundel**, center **(−5.25, back flush −0.081, 1.55)** = LOGO_ORIGIN.
Logo pool light AREA 90W at (−5.25, −0.75, 1.72).

## 5. SCROLLER (category/selection) state — collection `BA_SW_SCROLLER_PAGE`

Show: `BA_SW_SCROLLER_PAGE` (+ shared architecture). Hide: `BA_SW_RR_HOME_BAYS`,
`BA_SW_REAL_PRODUCTS`, `BA_SW_REAL_LOGO`.
Camera **`BA_SW_FUTURE_TILTED_SCROLLER_CAMERA_REFERENCE`**: loc (−6.3, −9.8, 1.75),
aimed at (0.15, −0.1, 1.58) (slight right-receding tilt, rot ≈ (89.2°, 0, −33.6°)), **29 mm**.
Web behavior: camera translates +X along the wall; bay grid repeats. The desktop browser keeps
the tilted scroller composition; portrait browser uses a backed-up category camera aimed closer
to the active big bay so the category title and raised shelf-front text do not crop.

### 5.1 Description column (in the hidden-logo zone)
All physical, flush on wall face (place y −0.085, extrude 4-12 mm). Blender left edge **DX = −5.45**.
The web runtime uses the same physical wall-copy idea but shifts the group inward to about **x −4.72**
so the tilted category camera keeps the heading and description readable. This is category-level
copy, not product-specific copy. It renders as thick wall-mounted vector text in Blender and as
extruded SVG/TextGeometry in the web runtime.

| Element | Object | z | Size / dim | Material |
|---|---|---|---|---|
| Eyebrow "COLLECTION" | `BA_SP_DESC_EYEBROW` | 2.72 | 0.09 | gold matte (0.65, 0.45, 0.15, metal 0.9, rough 0.35) |
| Title = category name | `BA_SP_DESC_TITLE` | 2.42 | 0.22 | black |
| Divider strip | `BA_SP_DESC_DIVIDER` | 2.28 | 1.5 × 0.008 × 0.012 (center x −4.7) | gold matte |
| Body = category art-type description | `BA_SP_DESC_BODY` | 2.05 | 0.085 | black |
| Price | `BA_SP_DESC_PRICE` | — | hidden/empty in category state | — |

### 5.2 Big selection bay (`BA_SP_BIG_*`)
Center x **−2.55**. Recess **2.0 w**, spans **z 0.56 → 2.91** (h 2.35, cz 1.735) —
**top aligned to row-0 recess top, bottom to row-1 recess bottom** (Master Khurram's rule).
Jamb 0.16; cap at z 2.99; shelf 2.32 × 0.36 × 0.1 at (−2.55, −0.26, 0.51) = same z as row-1
shelves; underglow (−2.55, −0.105, 0.442); top strip z 2.89.
Product: `BA_SP_PROD_BIG_HORSE` 1.7 m wide, centered z 1.735, flush −0.1805.
Spot `BA_SP_BIG_SPOT` 70W at (−2.55, −0.75, 2.85) rot_x 25°.

### 5.3 Small bay grid (2 rows × 10 columns, continues right)
Bay: recess **0.82 w × 0.98 h**, jamb 0.07, shelf 0.96 × 0.36 × 0.1 at y −0.26
(z: row0 1.88, row1 0.51), underglow y −0.105 (z row0 1.822 / row1 0.452), top strip at
recess top − 0.02 (z row0 2.89 / row1 1.52).

- **Row centers: z = 2.42 (row 0) and 1.05 (row 1)** → recess tops 2.91 / 1.54, bottoms 1.93 / 0.56.
- **Column centers: x = −0.4 + 1.22·k** (k = 0..9 → −0.4, 0.82, 2.04, 3.26, 4.48, 5.7, 6.92, 8.14, 9.36, 10.58).
- Flat art normalized to **0.60 m wide** flush at −0.1805; acrylic posters 0.44 m wide;
  3D objects stand ON the bay shelf (y ≈ −0.28).
- Current occupancy (linked duplicates of `BA_PRODUCTS` meshes; repeats fill far columns):
  row 0 = Athena, Astronaut, Lion, Wolf-SVG, Elephant, Ironman, Elephant², Astro², Wolf², Horse³;
  row 1 = Wolf-layered-stack (L1–L4), Horse, Panther (on shelf), Fidget (on shelf), Athena², Lion², Lion³, Athena³, Ironman², Wolf³.

Lights: row washes AREA 12 × 0.5 at (5.0, −1.4, 3.1) rot 55° 180W (row0) and (5.0, −1.6, 1.9)
rot 65° 140W (row1); front fill 15 × 2.8, 260W at (2.4, −6.5, 2.5) rot 72°; description wash
2 × 0.4, 90W at (−5.3, −1.0, 2.4). Web note (D41): the browser uses NO spotlights — only
hemisphere/area fills plus additive warm pool planes (which also avoids the old WebGL
shader failures from too many spot/shadow uniforms).

## 6. PRODUCT VIEWER state — web built, Blender collection optional

Same wall. The web runtime uses one centered product bay on the wall, camera zooms close with a
clamped orbit, and DOM product UI appears around it. No extra category grid or wall-above-bay title
appears in this state. Seven browser-safe 3D print STLs now load as real viewer meshes; larger
figure/lamp STLs remain lightweight stand-ins until optimized or exported as approved web assets.
If a Blender parity collection is needed later, build it as `BA_SW_VIEWER_PAGE` following the
frame-box law and document its exact coordinates here.

## 6b. PREFAB HIERARCHY (2026-07-03) — the web-export node tree

Every architectural group is rooted in an **Empty** (`PF_*`). Empties export as named glTF
nodes; the web code addresses prefabs by these names. Object parenting = hierarchy;
collection membership = state visibility (unchanged).

```
PF_ARCH_SHELL (0,0,0)            wall, header, cove, skirting, floor, all seams/marks, cove wash
PF_TRACK (0,−0.42,3.30)          rail + 7 stems
  └─ PF_TRACK_FIXTURE_00..10     (x,−0.42,3.155) — body + lens + spot light each
PF_BAY_HOME_<CAT> (cx,−0.08,1.745)   [WALL_ART −3.35 · DIGITAL_ART −1.25 · LAYERED_ART 0.85 · 3D_ART 2.95]
  ├─ all BA_RR_<CAT>_* frame parts, shelf-front raised text, pool light
  ├─ products + product spot (collection: BA_SW_REAL_PRODUCTS)
  └─ PF_BAY_HOME_<CAT>_SLOT (cx,−0.18,1.745)   ← product mount point for web
PF_LOGO (−5.25,−0.08,1.55)       real logo mark + logo pool light
PF_LIGHT_RIG_HOME                front soft fill
PF_DESC_PANEL (−5.45,−0.08,2.0)  eyebrow/title/divider/body/price + desc wash
PF_BAY_BIG (−2.55,−0.08,1.735)   frame parts + big horse + spot + PF_BAY_BIG_SLOT (−2.55,−0.18,1.735)
PF_BAY_SMALL_R{r}C{c} (cx,−0.08,cz)  r∈{0,1}, c∈{0..9} — frame parts + product + _SLOT (cx,−0.18,cz)
PF_LIGHT_RIG_SCROLLER            row washes + scroller front fill
```

**SLOT rule:** web code mounts/swaps product meshes at the `*_SLOT` empty (recess-back plane,
y −0.18). A bay prefab is fully self-contained: instancing a bay = clone `PF_BAY_SMALL_*`.

⚠ Parenting gotcha (cost one corruption, 2026-07-03): after `child.parent = empty`, set
`child.matrix_parent_inverse = empty.matrix_world.inverted()` only AFTER
`view_layer.update()` — a freshly created/moved empty has a stale `matrix_world`.
Fix if it recurs: recompute all `matrix_parent_inverse` from updated parents (children's
local matrices are untouched, world positions restore exactly).

## 7. Materials registry

| Material | Used on | Key values |
|---|---|---|
| `BA_RR_warm_plaster_real_ratio` | main wall | base (0.53, 0.40, 0.25), rough 0.86 — warm plaster |
| `BA_RR_bay_inner_gray` | ALL recess back panels (25) | (0.62, 0.61, 0.585), rough 0.85 — the gray canvas behind black art |
| `BA_MAT_ASH_WOOD_DARKGREY` | ALL bay frames: jambs, caps, shelves (100 objects) | REBUILT 2026-07-03 (natural grain): stretched noise streaks (scale 0.55/9/9, detail 7) mixed 0.28 with fine grain noise (2.5/45/45), ramp linear 0.045→0.145 slightly warm-neutral, roughness varies 0.55–0.72 with streaks, bump 0.09 from grain |
| rail/track black (rail's slot 0) | rail, stems, fixtures (lighting hardware only) | matte near-black |
| `BA_RR_recess_smoked_backing` | 3D-bay in-recess shelves | (0.025, 0.02, 0.016), rough 0.58 |
| `BA_RR_warm_gold_emission` | cove, strips, underglows, lenses, shelf-front text | emission (1, 0.62, 0.28) × 4.0 |
| `BA_SP_gold_matte` | description gold text/divider | (0.65, 0.45, 0.15), metallic 0.9, rough 0.35 |
| `BA_RR_dark_wood_floor` / `BA_RR_floor_seam_soft` | floor / seams | (0.115, 0.062, 0.032) r0.45 / near-black seams |
| `BA_MAT_BLACK_WOOD` | horse, wall-art SVGs, panther, fidget | black wood |
| `BA_MAT_DIGITAL_IRONMAN` | acrylic panel | image texture |
| `BA_MAT_WOLF_1–4` | wolf layers | dark→light gray gradient |

## 8. Product library — scene `BA_PRODUCTS` (same .blend)

`BA_WALLART_ARRAY` (Athena/Astronaut/Lion/Wolf/Elephant SVG extrusions) ·
`BA_LAYERED_ARRAY` (Bear/Mandala/Eclipse grouped layer stacks) · native layered source
collections (Wooden Multilayer 3D Mandala, Bear Wall Decor, Multilayer 3D Wolf, Multilayered
Motorcycle, Multilayered-mandala) · `BA_TEST_DIGITAL` (5 real poster panels) ·
`BA_PROD_HERO` (horse-head, 2×3 ft acrylic, Wolf L1–L4, panther STL, fidget-axis STL).
Gallery states use **linked duplicates** of these — edit the source mesh once, all states update.

Layered Art web export contract (D33): Blender remains source of truth for layer membership/order,
but the website consumes per-layer SVG cut paths exported by `scripts/export_layered_svg_layers.py`
into `public/products/layered/svg/`. Three.js extrudes each SVG layer with real thickness and steps
the layers in depth. Wolf and Eclipse are front-detail-first sources, so the web reverses their
depth order to keep the solid backing sheet against the wall. Current exported stacks: Wolf (4),
Bear (6), Mandala (6), Eclipse Mandala (6), Motorcycle (5).

Current web catalog pass (2026-07-03): 53 Wall Art SVG products, 30 Digital poster products,
5 Layered SVG stacks, and 15 3D Object entries — ALL 3D Objects now load real STL product data
from `public/products/3d/` (7 small originals + 8 heavy sources decimated per D38 via
`scripts/optimize_3d_prints.py`).

Digital Art web contract (D36): each product is ONE poster mesh — a thin black sheet
(BoxGeometry) whose FRONT FACE (+Z material slot) is textured with the final print file, plus
four gold corner standoff pins (render-target detail). No separate image plane, no board+inset.

## 9. Invariants — the do-not-regress list

1. One wall. States = collection visibility + camera, never separate rooms.
2. Contrast law §3: warm plaster wall · gray bay interiors · dark-grey ash-wood frames · black track hardware · black art · warm gold accents.
3. Nothing floats: wall items flush −0.081, recess items flush −0.1805, measured on true mesh.
4. Shelves close the frame box (back edge inside wall, y −0.44..−0.08).
5. Underlights at the inner bottom edge (y −0.105), washing down the wall.
6. Spot fixtures are one designed element ON the rail; rail hangs from header stems.
7. Big bay top/bottom align exactly to small-row top/bottom (z 2.91 / 0.56).
8. Real meshes only — no placeholder art in any reviewed state. Real logo only (D21).
9. Asset gate (AGENTS §2): nothing exports to web before Master Khurram approves in Blender.
10. QA render PNGs are deleted after viewing. Review is live in the viewport.
11. Blender crash rule: never run blocking `bpy.ops.render.render()` through the MCP execute
    channel; use the MCP render tool; SAVE after every milestone.

## 10. Web mapping notes (for the Three.js rebuild)

- Blender (x, y, z) → current code-native web: **web X = Blender X**, **web Y = Blender Z**,
  **web +Z = Blender −Y**. Shared architecture constants in `src/scene/GalleryScene.js` preserve
  the Blender x positions and vertical z values directly.
- Export per state only when needed. Current architecture is code-native Three.js. Layered Art ships
  as SVG cut-layer exports from Blender source objects, not raw GLB meshes.
- Camera lens 31 mm home / 29 mm scroller at 1672×941 — lock horizontal FOV, compute per-aspect.
- Emissive strips → emissive materials + real lights in code; AgX-like tonemapping
  (`ACESFilmic` nearest) with warm key (1, 0.72, 0.45).
- **Color parity law (D37):** web hexes = Blender linear → sRGB (1.055·x^(1/2.4)−0.055).
  Current derived set: warm key #ffddb3 · front fill #ffeacb · plaster #c0aa89 ·
  bay inner #cecdc9 · ash ramp #424242–#6a6a6a · floor #5f4632 · gold emission #ffce90 ·
  gold matte #d3b36c · black wood #302c29. Recompute here when the .blend changes.
- Bay-glow parity (D41 fully-lit room): glowing recess puck + soft down-pool in every bay,
  underlight wash below each shelf, warm floor glow pool in front of each bay — all cheap
  additive planes, not real lights (D34). No spotlights or wall scallops anywhere.
