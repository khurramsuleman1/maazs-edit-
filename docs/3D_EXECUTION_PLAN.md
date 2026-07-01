# 3D EXECUTION PLAN — Black Aesthetics gallery

> How we build the website 3D scene properly, in reviewable stages, matching the
> inspiration refs in `docs/inspiration-references/`. Supersedes the ad-hoc v1/v2 builds.
> Read with `ba_spec_v2.md` (§5–§11) and `CATALOG.md` (5 categories).
>
> **Current active Blender brief:** `docs/BLENDER_SMALL_ROOM_BUILD_BRIEF.md` supersedes the
> older large-gallery direction for the D20/D22 small-room storefront.

---

## 1. Why v2 still looks like "just a cube" (honest diagnosis)
- **One sealed box.** A single rectangular room with flat walls = reads as a cube. The
  refs show a **deep gallery with receding space** — bays, openings, a far vanishing point.
- **No architecture.** No wall reveals, recesses, ceiling beams/coffers, floor seams,
  skirting, or entrance depth. Flat planes catch light flatly → no richness.
- **Massing/scale not blocked out.** Proportions were guessed, not designed against camera.
- **Proxy props.** Trees/tee are placeholders; panels float without consistent hanging logic.
- **Lighting too uniform.** Needs layered light (skylight + track accents + bounce), not fill.
- **Reviewed from one camera.** Can't judge a space from a single angle — must orbit it.

## 2. Target (from the references)
A bright, pale, **walkable museum gallery**, not a section of website with a 3D box:
- Deep hall with **receding bays**, track-lit black art on pale walls, white plinths,
  greenery, polished pale floor with soft reflections, a clear **entrance moment** (archway).
- Black products read as precious against pale surroundings (rim light, clean silhouettes).
- Space supports the spec's scroll flow: Hero (entry) → Category showcase → Collection → Product.

## 3. Build methodology — staged, each stage gated by your review
Every stage ends with a **multi-angle review** (see §5) and your approval before the next.

- **Stage A — Greybox blockout** (no materials, solid shading)
  Design massing to scale: hall length, ceiling height, bay rhythm, entrance depth,
  plinth positions, camera path. Goal: the space already feels deep and right in grey.
- **Stage B — Architecture detailing**
  Wall reveals/recessed niches for art, ceiling beams or a central skylight slot, floor
  seams/inlays, skirting, doorway/arch depth, partial side openings (not a sealed box).
- **Stage C — Materials**
  PBR pale concrete/plaster (walls), polished pale stone (floor), matte black (products),
  dark metal (track rails), glass, foliage. Real PBR via PolyHaven when its connector is up;
  high-quality procedural otherwise.
- **Stage D — Lighting**
  Skylight/large soft source + ceiling **track spots** accenting each artwork + subtle bounce.
  Bright/clean mood; preserve black-product contrast.
- **Stage E — Product & category staging**
  Place real laser-cut Wall-Art panels, Digital-Art poster panels, Layered-Art, 3D-Objects,
  and the Apparel dummy into **per-category zones/bays** (maps to the 5 nav categories).
- **Stage F — Review & approval** (hard gate, D14) — from all sides, in Blender.
- **Stage G — Web optimization & export**
  Decimate/bake where needed, atlas textures, export **GLB + Draco/KTX2** per `ba_spec_v2 §12`,
  wire into `src/` only after approval.

## 4. Scene organization in the master .blend (D13)
- Scene `BA_WEBSITE` = the gallery (main website scene).
- Collections: `BA_ENV_SHELL`, `BA_ENV_ARCH`, `BA_ENV_LIGHTING`, `BA_ENV_GREENERY`,
  `BA_CAT_APPAREL`, `BA_CAT_WALLART`, `BA_CAT_DIGITAL`, `BA_CAT_LAYERED`, `BA_CAT_3DOBJECTS`,
  `BA_REVIEW_CAMERAS`.
- Naming: `BA_ENV_*`, `BA_CAT_*`, `BA_REV_*` cameras. Products cloned (independent data) from
  the QA collection so the original `Scene` and its 150 meshes stay untouched.

## 5. Multi-angle review protocol ("view from all sides")
A fixed set of review cameras lives in `BA_REVIEW_CAMERAS`, so any stage can be judged in the round:
- `BA_REV_FRONT` — entry hero
- `BA_REV_34L`, `BA_REV_34R` — three-quarter left/right (massing & depth)
- `BA_REV_LEFT`, `BA_REV_RIGHT` — side elevations
- `BA_REV_TOP` — plan view (layout/flow)
- `BA_REV_WALK` — eye-level interior (the scroll-through feel)
Review = step through these cameras in Blender (material/solid shading). No rendered stills (D14).
Optional: a turntable empty to orbit the whole space.

## 6. Web mapping (so 3D ≠ decoration)
Gallery zones map 1:1 to nav categories and the scroll flow (`ba_spec_v2 §7–§11`):
entry/Hero → category bays (Apparel, Wall Art, Digital Art, Layered Art, 3D Objects) →
collection grid → product detail. Camera moves along the hall on scroll; click punches into a bay.

## 7. Acceptance bar — "not a cube"
A stage passes only if: the space reads as **deep** from the 3/4 and top cameras; walls have
**relief/detail** (not flat planes); scale feels human (door/plinth/art sized right); black
products have **clear silhouette + rim contrast**; and lighting is layered, not flat.

## 8. Known risk
Blender MCP connection is **intermittent** this session (frequent drops/timeouts). Build in
**small idempotent steps** that can resume after a drop; verify with lightweight queries, not
heavy viewport redraws. Keep the single-agent Blender lock (D15).
