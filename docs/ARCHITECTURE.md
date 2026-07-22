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
| Floor | `BA_RR_DARK_WOOD_FLOOR_CONTINUOUS` / web D50 marble override | (2.75, −3.1, −0.045) | 17.7 × 6.2 × 0.09 |
| Floor seams | web D50 marble slab seams | slab grid in procedural texture | black marble with gold veining |
| Plaster seams/marks | `BA_RR_SUBTLE_*` | verticals x −6.2, −4.35, −3, −1.65, −0.3, 1.05, 2.4, 3.75 | cosmetic, on wall face |
| Cove wash light | `BA_RR_LONG_COVE_WALL_WASH` | (2.6, −0.62, 3.25) rot_x 75° | AREA **320W** (1, 0.72, 0.45), size 12 |

General illumination (D41, 2026-07-03): FULLY LIT ROOM — world (0.09, 0.075, 0.058) ×1.0;
home/scroller front fills 520W; cove 400W; bay warm pools 120W; row washes 240/200W;
desc wash 90W. No spotlights anywhere; bay emissive strips/pucks/underlights are furniture.

Camera/render: res **1672×941 (16:9)**, Cycles, color mgmt **AgX / AgX-Punchy**.

### 2.1 D57/D64 web-only architecture simplification (2026-07-22)

The live code-native Three.js shell now renders exactly one shared architectural mesh on both
desktop and mobile:

| Web element | Center (x,y,z) | Dim (x,y,z) | Material |
|---|---|---|---|
| Tall plaster wall | (2.6, 2.6, −0.08) | 18 × 9.2 × 0.16 | one seamless 2048×1024 procedural warm-plaster color/bump texture |

The web floor, header band, cove mesh, track rail, stems, skirting, wall-shade overlay, floor-seam
meshes, and decorative wall-fixture groups are no longer instantiated. This is a **web runtime
override**; the approved Blender construct remains unchanged in `BAstore.blend`. The taller wall
extends below every camera frame so the canvas has no floor line or floor reveal. Lighting is
non-architectural: one tall wall wash, broad front fills, and view-local additive product pools.
Mobile adds a soft key/fill/rim rig and viewer-only softbox/rim lights against the same wall.

**D66 focus-light override:** every additive product pool uses a 1.35× wider plane, 0.52×
opacity, and a softer radial texture (center alpha 0.62 rather than 0.95). Overlapping hero,
array, and viewer pools must read as one broad warm falloff, never a white hotspot behind the
focused piece.

**D67 portrait composition:** Gallery View is a four-stop vertical zigzag rather than one centered
line. Hero centers alternate right/left/right/left around camera x `−4`: Wall Art x `−3.68`,
Digital Art x `−4.30`, Layered Art x `−3.68`, and the wider 3D Object x `−4.28`. Every label
sits on the opposite side of the camera axis from its piece and shares the piece's vertical
center, forming four unambiguous text/product pairs. Each complete category section—including
any shelf/light—reveals only after the previous section settles
(`0.98 s` interval, `0.46 s` piece reveal). Its DOM label begins only after the piece lands and
finishes before the next category starts, preserving the exact piece → UI → next-piece order.
Gallery hero reveals keep each product root at its final wall coordinate and scale around that
product's own pivot. The category-zone transform never scales from zero, because doing so would
make locally offset heroes appear to spawn elsewhere and travel across the wall. The 3D shelf uses
the same fixed-position scale reveal as its panther.
On category pages, collection-ring controls remain in the lower lane; product-ring arrows flank
the centered product at about 51.5% viewport height and its active plaque sits below at about
70.5%, so UI follows the active 3D composition instead of sharing one generic position.

Portrait rendering uses the device's real viewport aspect with no fixed 9:16 scissor/letterbox.

## 3. Bay anatomy — THE FRAME BOX LAW (applies to every bay, any size)

> **D49 web supersession:** the current web runtime no longer renders visible category,
> subcollection, product-grid, or viewer bay frames. This section remains the Blender/legacy
> reference for older bay-prefab states; the live browser uses bayless wall mounts described in
> §5/§6, with products and thick extruded vector text mounted directly on the plaster wall.

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

## 4. HOME states

### 4.A D48 Intro Home

The initial web mode is `intro`: the shared room remains visible, but the wall carries only the
large BA mark at x `−3.35`, the statement `OBJECTS WITH PRESENCE.`, and a short About Us paragraph
across the center/right wall. A DOM `BROWSE STORE` command is centered above the floor. It enters
the D47 product wall without replacing or rebuilding the shared architecture. Active reference:
`docs/inspiration-references/intro-home-reference-v1.png`.

The former Home is renamed **Browse Home** in product/navigation language while retaining internal
web mode `home` for compatibility. Intro Home is deliberately non-commercial and has no product
meshes, bays, category dock, bag, or checkout controls.

### 4.B Transition sequence

All state transitions are deterministic staged reveals (D65). Interaction locks first; every
outgoing piece hides in sequence before the camera or destination changes. If the destination uses
the same product, the real product object detaches from its old parent, travels, and is reparented
at the destination—no duplicate product is loaded or swapped in. Its final footprint is refit at
commit time because SVG/STL placeholders may resolve while it travels. Camera motion starts only
after that product lands. Destination wall copy, UI, and product mounts then reveal one at a time;
interaction resumes only after the final item settles. Mobile product arrays build the selected
item first, pace neighbour creation, and assign reveal order locally rather than from catalog index.

> **D47 HOME REVISION — IMPORTANT:** the four HOME bays below
> describe the currently approved/in-site implementation, but are superseded for the next Home
> revision by `docs/inspiration-references/home-view-revision-bayless-v1.png`. The new Home removes
> all bay geometry and arranges four direct-mounted product zones across the same continuous wall:
> Wall Art salon silhouettes, Digital Art poster sheets, Layered Art hero + mandalas, and minimal
> shelves carrying 3D objects. Each zone is one hover/click target; hover moves only that zone
> toward the viewer and enlarges it uniformly while the corresponding bottom-nav category is
> highlighted. Category, subcollection, and viewer geometry is now bayless too per D49. Lighting
> target: warm textured plaster, even logo-side illumination, controlled local product pools, rich
> poster blacks without washout, and dark sculptural products with readable edge highlights.

### 4.0 D47 bayless Home geometry

On 2026-07-12 Master Khurram explicitly authorized the reference composition to be implemented
directly in the website using existing approved/data assets. Blender parity is delegated to Claude
and must follow `docs/CLAUDE_BLENDER_D47_HANDOFF.md`; it no longer blocks this web-only Home revision.
The later D49 web pass extends the same bayless language to category, subcollection, and viewer states.

Collection **`BA_HOME_D47_STAGED`** contains four identity-root zone empties for future web hover
mapping. All displayed products are evaluated/baked copies of existing approved product geometry;
source objects and every §5/§6 bay remain untouched.

| Zone root | Staged composition (x, z; target bounds) |
|---|---|
| `D47_ZONE_WALL_ART` | hero horse `(−3.55, 2.10; 1.35×1.65)`; salon row x `−4.45/−3.78/−3.12/−2.52`, z `0.84–0.88`, bounds `0.54–0.62×0.58–0.68` |
| `D47_ZONE_DIGITAL_ART` | Ironman poster sheets `(−1.65,1.92;0.58×1.08)`, `(−0.92,1.90;0.72×1.58)`, `(−0.18,1.05;0.50×0.86)` |
| `D47_ZONE_LAYERED_ART` | one wolf stack hero only, web pivot `1.55`, normal gray layer palette; no extra small wall-art pieces in Browse Home |
| `D47_ZONE_3D_ART` | one forward shelf only, web pivot `3.55`; one panther/leopard product, rotated sideways and lifted to stand on top of the shelf so it projects outward instead of into the wall |

D47 review camera **`BA_D47_HOME_REVIEW_CAMERA`**: location `(−0.72, −12.2, 1.72)`,
31 mm, aimed at `(−0.72, −0.08, 1.72)`. Home-only AREA pools (still no spotlights): logo/wall/
digital/layered/3D energies `150/48/95/58/72 W`, color linear `(1.0, 0.62, 0.28)`.
Home-only staged materials: `D47_MAT_BLACK_SCULPT`, `D47_MAT_SHELF_BLACK`, and dark layered
ramp `D47_MAT_LAYER_1–4`; these do not alter source product materials.

The web runtime mirrors these roots as `homeZones`: each is one transform parent, one broad
invisible category hit target, and several real product displays. Hover uniformly scales the root
to 1.065 and moves it 0.20 m toward the camera; it never scales the wall or a bay. Desktop Home
camera is `(−0.54, 1.62, responsive-z)` looking at `(−0.54, 1.60, 0)`. Portrait shifts x to
`−4.0` to feature the complete logo and Wall Art while the dock exposes all categories.

Web visual-parity pass (2026-07-12): Home content is compressed to roughly x `−4.9..4.35`
so the wall occupies more of the viewport and loses the dead left margin. Zone pivots are Wall
`−2.45`, Digital `−0.25`, Layered `1.55`, and 3D `3.55`; logo center is `−4.20`, and desktop
Home camera/look x is `−0.25`. The Wall/Digital products were slightly reduced and redistributed
to keep visible air between neighboring meshes. Layered Home uses one correctly colored wolf stack;
3D Home uses one shelf carrying one sideways panther set forward from the wall. Seven Home-only warm keys align
with visible track heads and provide the reference's separated wall pools. These lights and the
Home-only dark product materials remain children of `homeGroup`, so downstream bay states retain
their existing lighting/material contract.

Mobile Home correction (2026-07-14, shell superseded by D64): portrait Intro/Home uses the 9:16 scissor viewport with
camera x `−4.0`, y/look `1.25`, z `4.35`, and the portrait Intro copy scales to `0.42` at x
`−4.18`. This intentionally crops out header/track/roof hardware, keeps the BA mark and copy on
the wall, and the D64 wall now continues through the bottom of frame with no floor strip. Desktop
Home framing is unchanged.

Future web interaction contract after approval: each zone root is one raycast target. Hover moves
the complete zone toward the camera, uniformly scales it to approximately `1.08`, adds a restrained
warm focus pool, and applies an `is-previewed` state to the matching bottom-nav category. Pointer
leave returns both zone and nav state. Click enters the bayless category wall state.

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
Web behavior (D43/D44/D46/D49): the category camera starts on the tilted scroller composition, then
eases to a direct wall view once dragging begins. Desktop angled framing uses web camera
`(-3.12, 1.82, 7.85)`; direct-wall framing uses camera/look X `1.15` at Z `10.0`, showing the
complete hero wall mount plus the full eight-niche Wall Art array at 16:10 without a dead left margin.
Mobile direct-wall framing prioritizes the browse array at camera/look X `0.9`, Z `12.5`; the
narrow portrait view cannot usefully show both the hero and multiple columns. The right-side
shelf/grid track translates left under
pointer drag, wheel, arrows, or keyboard. The
big selection mount remains fixed; small wall mounts are virtualized and stop being built once
their left edge approaches the hero boundary, so they shrink and disappear before crowding the
hero mount instead of loading or overlapping the entire catalog at once. Wall Art and Digital Art
first show Shopify-style niche wall mounts; selecting a niche swaps the moving track to only that
niche's products. Portrait browser uses a backed-up category camera aimed closer to the active
hero mount so category title and thick wall text do not crop.

State-motion contract (D49/D65): visible bay geometry is gone. The selected product mesh detaches
forward from its source wall mount, travels as the same object, and is reparented onto the
destination mount; the temporary destination copy is disposed, never shown as a replacement. A
piece absent from the new state is hidden before the scene/camera handoff. The shared grid
container is never scaled, so mounts cannot converge or intersect. Category/niche arrays reveal
one mount at a time. Transition progress uses real elapsed time rather than capped render-frame
delta, so heavy SVG/STL loading may skip frames but cannot freeze a handoff or leave stale content
under a new label. Product commerce controls remain delayed until the 3D handoff is established.

Viewer material controls (D59): Wall Art and 3D Object color selections clone and tint only the
active product's owned `MeshStandardMaterial` instances; shared wall, shelf, text, and light
materials are never mutated. The viewer-only DOM Wall Color drawer changes the shared wall
material's color multiplier while retaining its procedural plaster color/bump maps. It is a live
visualization control, not a commerce option, and defaults/resets to `#ffffff` (original plaster).

### 5.1 Description column (in the hidden-logo zone)
All physical, flush on wall face (place y −0.085, extrude 4-12 mm). Blender left edge **DX = −5.45**.
The web runtime uses the same physical wall-copy idea but shifts the group inward to about **x −4.82**
so the tilted category camera keeps the heading and enlarged description readable without colliding
with the big bay. This is category-level copy, not product-specific copy. It renders as thick
wall-mounted vector text in Blender and as extruded SVG/TextGeometry in the web runtime.

| Element | Object | z | Size / dim | Material |
|---|---|---|---|---|
| Eyebrow "COLLECTION" | `BA_SP_DESC_EYEBROW` | 2.72 | 0.09 | gold matte (0.65, 0.45, 0.15, metal 0.9, rough 0.35) |
| Title = category name | `BA_SP_DESC_TITLE` | 2.42 | 0.22 | black |
| Divider strip | `BA_SP_DESC_DIVIDER` | 2.28 | 1.5 × 0.008 × 0.012 (center x −4.7) | gold matte |
| Body = category art-type description | `BA_SP_DESC_BODY` | 2.05 | 0.085 | black |
| Price | `BA_SP_DESC_PRICE` | — | hidden/empty in category state | — |

### 5.2 Big selection wall mount (`BA_SP_BIG_*`)
Center x **−2.55**. No visible recess, frame, jamb, cap, shelf, puck, or underlight. The mount
uses an invisible raycast/transition box about **2.12 w × 2.35 h** centered z/y `1.735`.
Product: current category/niche lead product, 1.64 m wide target, mounted directly on the wall
with a warm additive wall pool behind it. The product name is thick black extruded vector text
below the hero in category mode. Spotlights: NONE (D41).

### 5.3 Small wall-mount grid (2 rows × 10 columns, continues right)
Each grid item is a bayless wall mount: no visible recess, frame, jamb, cap, shelf, puck, or
underlight. The runtime keeps an invisible hit/transition box about **0.90 w × 0.98 h** around
each product. Product/niche labels are thick black extruded vector text below the product; product
counts remain small gold extrusions near the product.

- **Row centers: z = 2.47 (row 0) and 1.00 (row 1)** → extra vertical breathing room between shelf/front labels.
- **Column centers: x = −0.4 + 1.36·k** (k = 0..9 → −0.4, 0.96, 2.32, 3.68, 5.04, 6.4, 7.76, 9.12, 10.48, 11.84).
- Direct categories with six or fewer products, including Layered Art, use compact web centers
  `x = −0.18 + 1.05·k` so all pieces are visible in the first category view.
- Flat art normalized to **0.60 m wide**; acrylic posters 0.44 m wide. Per D52, 3D Objects keep
  the bayless wall language but add black floating shelves with their back edge offset from the
  plaster; object meshes sit forward over those shelves instead of mounting flat to the wall.
- Runtime occupancy (D43): Wall Art and Digital Art initially show subcollection/niche cards
  (examples: Animals, Anime/Manga, Minimalistic, Naruto/Anime, Comics & Movies, Smoking Lady).
  After a niche is selected, the same two-row moving track shows only products in that niche.
  Layered Art and 3D Objects continue to show direct products because their catalogs are small.
  Moving-track mounts stay full-size at the initial first column, then shrink before disappearing
  at the hero boundary and grow back as they re-enter the safe wall area. Hover enlarges/lifts only
  the product display inside the mount and shows an additive warm focus pool; no real spotlights
  are created.
- Small 3D-object procedural previews use a conservative `0.42` scale for angled-camera clearance.
  Grid hover animation multiplies each display's stored base scale instead of resetting it to `1`.

**D57 mobile override:** portrait category/subcollection items move left-to-right through a shallow
depth ring centered at web `(0.9, 0.74)`. The centred item is nearest/full scale; neighbours rotate
and recede in +/−X with decreasing scale. Horizontal drag, wheel, and arrow controls advance and
snap one item at a time. DOM name/price pills use the same ring slot data, so the visible label
travels with its mesh instead of remaining detached in a fixed bottom plaque.

**D62 mobile category states:** categories with collections use the original shallow ring at
`(0.9, 0.74)` beneath one separate hero mount at y `2.05`. Once a collection is selected—or a
category leads directly to final products—the separate hero mount is removed and the product ring
moves to `(0.9, 1.62)`. Product mounts grow from `1.02×1.08` to `1.42×1.50`; flat product display
bounds grow from `0.76×0.84` to `1.10×1.24`, and object bounds grow from `0.68×0.64` to
`0.98×0.96`. The active item becomes the visual centre while neighbours remain partially visible
for horizontal continuity. D65 pushes final-product neighbours farther outward with stronger scale
falloff and renders only the active item's DOM plaque; neighbour meshes remain as quiet previews.

**D63 customization hero contract:** every category's lead item is a distinct local “Customize
Your Own” product that opens the normal viewer in Custom Studio mode. It reuses existing approved
or product-data geometry only as an example preview; it is not a new authored 3D asset and does not
represent the customer's final design. Wall/Digital keep this custom item in the separate hero
mount above their collection ring. Layered/3D have no collection tier, so the custom item is the
first centered entry in the enlarged final-product ring. The Custom Studio exposes the category's
existing size/material/finish/color controls and routes the final quote request through WhatsApp.

Lights: row washes AREA 12 × 0.5 at (5.0, −1.4, 3.1) rot 55° 180W (row0) and (5.0, −1.6, 1.9)
rot 65° 140W (row1); front fill 15 × 2.8, 260W at (2.4, −6.5, 2.5) rot 72°; description wash
2 × 0.4, 90W at (−5.3, −1.0, 2.4). Web note (D41): the browser uses NO spotlights — only
hemisphere/area fills plus additive warm pool planes (which also avoids the old WebGL
shader failures from too many spot/shadow uniforms).

## 6. PRODUCT VIEWER state — web built, Blender collection optional

Same wall. The web runtime uses one centered bayless product wall mount, camera zooms close with a
clamped orbit, and DOM product UI appears around it. Non-object products sit about `0.48` web units
off the wall so rotation does not intersect the wall plane. Per D52, 3D Objects sit farther forward
on a black floating shelf offset from the plaster. The product title appears above the product as
thick black extruded vector text on the wall. Seven browser-safe 3D print STLs now load as real
viewer meshes; larger figure/lamp STLs remain lightweight stand-ins until optimized or exported as
approved web assets.
On mobile (D57/D61/D68), the viewer fills the real device viewport and uses a dedicated warm RectArea
softbox plus amber rim light in addition to the mobile key/fill rig. D68 aligns the viewer camera
`(0.9, 1.66, 4.7)`, look `(0.9, 1.66, 0)`, mount `(0.9, 1.62, 0.18)`, and initial product
footprint with the active final-product ring slot. A category→viewer handoff therefore keeps the
selected product and camera stationary while the neighbouring products clear and viewer UI appears;
the return handoff preserves the same center while the product ring rebuilds around it.
The right rail highlights one active
customization group; that group's compact option buttons render directly above the enlarged bottom
commerce panel, which carries product/price, quantity, Cart, and Buy. Desktop uses a left
customization panel and right information/commerce panel. Context navigation is a desktop bottom
path (Home → category → optional collection → product) and a single-step mobile back button between
the logo and Search. The temporary layout override now lives inside the Information panel beside
About/contact links instead of in the customer-facing header.
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
| D50 web black-gold marble floor | floor / slab seams | procedural near-black marble base, subtle slab seams, shorter multidirectional grey/gold veins with small branches, emphasized gold strokes/flecks, higher repeat to avoid stretching, rough 0.28, metal 0.18 |
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
12. D64 web shell exception: desktop and mobile share only one tall textured wall; there is no live
    web floor. Legacy floor/header/track/skirting/fixture geometry remains Blender reference only.
13. D58/D61 responsive framing: automatic mode resolves real devices at ≤760 px to mobile and wider
    viewports to desktop. Real phones use their full viewport, while forced mobile preview on a
    laptop uses a centred 390×844 scissor whose DOM frame and Three.js camera share the exact same
    bounds. The temporary layout override is available only inside the Information panel.
14. D61 viewer layout: mobile customization stays on the right rail with only the active group's
    options above the bottom commerce panel; desktop customization stays left and product
    information/commerce stays right. Neither layout may cover the maximum-size viewer product.
15. D62/D63 mobile browse hierarchy: only collection-choice screens may show a separate category
    hero above a small ring. Final-product arrays use one larger centered ring with no duplicate
    hero; the category customization product is either that separate hero or the ring's first item.
16. D65/D68 transition ownership/order: outgoing pieces hide first; a product present in both
    states is the same reparented Object3D. Desktop and non-product-ring transitions refit/move it
    before camera motion; mobile final-product-ring → viewer preserves its exact product and camera
    transform, then reveals viewer UI. Never show source and copy together.
17. D66 web black/light contract: Wall Art and the Matte Black viewer variant render neutral
    `#000000` with high roughness, zero metalness, and restrained specular response. Warm scene
    lights may reveal form at an edge but must never lift black surfaces brown or grey. Focus pools
    stay broad and low-intensity per §2.1.

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
  bay inner #cecdc9 · ash ramp #424242–#6a6a6a · gold emission #ffce90 ·
  gold matte #d3b36c · Blender black wood #302c29 · D66 live-web product black #000000.
  Recompute Blender-derived values here when the .blend changes; retain D66 until explicitly superseded.
- Bay-glow parity (D41 fully-lit room): glowing recess puck + soft down-pool in every bay,
  underlight wash below each shelf, warm lower-wall glow pool in front of each bay — all cheap
  additive planes, not real lights (D34). No spotlights or wall scallops anywhere.
