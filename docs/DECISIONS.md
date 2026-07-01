# DECISIONS — locked choices

> Append-only. One line each. A decision here is settled; don't re-litigate it
> without Master Khurram. Format: `YYYY-MM-DD — D<NN>: decision — rationale`.

2026-06-22 — D01: Stack is Vite + Three.js (r155+), GLB/Draco assets — per ba_spec_v2 §3.
2026-06-22 — D02: Both AIs share one protocol (AGENTS.md); no hard task ownership.
2026-06-22 — D03: Comms = live STATUS.md (rewritten) + append-only CHANGELOG/DECISIONS/ASSETS — least tokens, full context.
2026-06-22 — D04: Hard asset gate — no GLB/website use until render approved by Master Khurram.
2026-06-22 — D05: Agents must ask before acting when a prompt lacks detail (AGENTS.md §3).
2026-06-22 — D06: Existing art folders + master .blend stay in place for now (path refs); migration needs approval.

2026-06-22 — D07: First 3D scope = 5 category HERO objects only (not per-product). Products stay 2D image cards until later.
2026-06-22 — D08: Nav categories are now FIVE — added "3D Objects" (= 3D Prints + Lamps + Accessories) as real 3D models.
2026-06-22 — D09: Wall Art 3D = laser-cut look; meshes ALREADY EXIST in master .blend (SVG exported + thickened). Reuse them.
2026-06-22 — D10: Digital Art 3D = flat poster panel, artwork as texture on ONE side.
2026-06-22 — D11: Apparel 3D = dummy placeholder object for now (no real model).
2026-06-22 — D12: The Blender pass is the WHOLE WEBSITE SCENE (environment + staging + lighting + placed hero objects), not just products. The approved render IS the preview of the final website look; web implementation follows the approved scene. Build the scene first.
2026-06-22 — D13: All Blender work lives in the master .blend (black_aesthetics_..._3d_meshes). Organize: website scene as the main scene; each product/product-group in its own Blender COLLECTION; product sets stored as separate SCENES within the same file.
2026-06-22 — D14: NO AI-side renders. The AI builds the scene and sets up the review CAMERA/viewport; Master Khurram inspects the 3D live in Blender himself. Approval still gates the web build, but review happens in-viewport, not via rendered stills.
2026-06-22 — D15: BLENDER LOCK — only ONE agent drives the Blender MCP at a time. The holder is named in STATUS under "🔒 BLENDER LOCK". The other agent must not send Blender commands until released.
2026-06-22 — D16: Current split — CLAUDE owns the Blender scene (environment + 3D). CODEX = website code only, stands down on 3D/scene/renders. Revisit when Claude releases the lock.
2026-06-22 — D17: Gallery = SINGLE refined HERO ROOM (not multi-room/hall). Build straight to detail (skip greybox). Refs = loose inspiration. Hard requirement: must NOT read as a flat cube — use architectural relief (recessed art niches, skylight coffer, floor seams, deep entry portal, wall reveals).
2026-06-23 — D18: Web flow pivots to one approved small-room storefront — categories are physical wall/display locations; browsing zooms into the selected wall area; generated imagery may inform wall textures, but the runtime must read as a 3D room with offset products and minimal luxury UI.
2026-06-23 — D19: D16 superseded — Codex may use Blender when holding the D15 Blender lock; still respect approval gates before GLB export or website asset use.
2026-06-23 — D20: Final visual direction = exact-logo luxury small-room storefront; make one approval image first, then match Blender/web environment to that approved visual.
2026-06-23 — D21: Use `LOGO Blackaesthetics.svg` as-is for brand marks in design and web UI — do not redraw, reinterpret, or replace the logo.
2026-06-23 — D22: Home storefront is a beautiful static composition; free-floating/animated 3D motion starts only in category lists, collection arrays, and product viewer states.
2026-06-23 — D23: Website runs on a hand-curated STATIC catalog of REAL products (test set) with real image textures (posters/wall-art SVG/layered fronts/apparel prints); 3D objects stay procedural until approved GLBs exist. Live Shopify Storefront wiring is optional/later.
2026-06-23 — D24: UNIFIED OPERATOR — Claude and Codex are ONE continuous worker, never running concurrently. **Supersedes D15, D16, D19**: no Blender lock, no file claims, no task ownership. Whichever body is running may use ANY toolset (Blender MCP or website code) freely. STATUS.md is the only sync mechanism. Approval gate (D04, D14) still applies before any asset reaches the website.
2026-06-23 — D25: Gallery environment = faceted 7-wall plan (thick central wall + three 30/60/90° facets per side; perpendicular ends barely in frame), one category staged per facet, warm spotlit ambience per small-room-storefront-exact-logo-v2.png. Built as scene BA_GALLERY; PENDING Master Khurram's in-Blender approval before website port.
2026-06-24 — D26: Apparel is removed from the current design/navigation — no apparel source mesh exists; active storefront has four even zones: Wall Art, Digital Art, Layered Art, 3D Objects.

---
## ⏳ Open (from ba_spec_v2 §16 — decide before deep build)
- Hosting: Vercel standalone vs Shopify Hydrogen?
- All product GLBs modeled in Blender, or some photo-textured simple meshes?
- Loading screen: progress bar vs BA logo only?
- Zone 3 sub-collection filter granularity (Wall Art has 10+)?
- Layered art: animate layer reveal in product detail?
