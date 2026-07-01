# Black Aesthetics — 3D Virtual Store
### Product Specification Document
**blackaestheticspk.com** · June 2026 · Confidential

---

## 1. What This Is

A scroll-driven, cinematic 3D storefront built in Three.js + Vite, with a Blender-authored environment. It is not a website with a 3D section. It is not a game. It is a living, breathing 3D world that happens to sell things — where the camera is the interface, scroll is movement, and clicking is intention.

The experience replaces the traditional Shopify storefront entirely. Products are discovered through the world, not through a category page.

---

## 2. Brand Philosophy in Design Terms

**"Black in a non-black world."**

The environment is raw, textured, heavy — brutalist concrete. Black is used as a deliberate material choice: product panels, frames, and surfaces are black against the concrete world around them. This makes the black objects feel precious, not default.

- Concrete is the world. Black is the product.
- Gold and warm white are the light. They touch things selectively.
- Typography is minimal — wide letter-spacing, thin weight, English only.
- Animation is subtle. The world breathes. It does not perform.

---

## 3. Tech Stack

| Layer | Tool |
|---|---|
| 3D Environment Authoring | Blender |
| 3D Export | GLB / glTF with Draco compression |
| 3D Runtime | Three.js (r155+) |
| Build Tool | Vite |
| Loaders | GLTFLoader + DracoLoader + KTX2Loader |
| Scroll → Camera | Custom scroll controller (lerp-based) |
| UI Layer | HTML/CSS overlay (pointer-events only on interactive zones) |
| Shopify | Storefront API v2024 (GraphQL) |
| Checkout | Shopify native checkout, opens in new tab |
| Hosting | TBD — Vercel or Shopify Hydrogen |

---

## 4. Entry Experience — The Intro

### What the user sees first
A centered **BA logo** on a **white or light gray background**. Clean. No other elements. No loading bar visible. This is the brand's first impression — stark contrast, the black logo on near-white.

### The transition
The moment the site is ready (assets loaded), a single sharp action occurs:

- The BA logo **scales down rapidly** — like a camera zoom-out
- The concrete 3D world snaps into view behind it, with the logo now **sitting small on the back wall** of the environment
- This is a **cut, not a fade** — instant, cinematic, like a film edit
- Duration: under 400ms
- The UI overlay appears simultaneously

### What this communicates
The logo was always part of the world. We just pulled back to reveal it.

---

## 5. The 3D World — Environment

### Space type
A **semi-open brutalist stage** — back wall and floor, open on the sides. The user is always looking at it frontally. The camera never rotates freely around the environment. It only moves on the vertical axis (scroll) and punches forward on click.

### Aesthetic
**Brutalist concrete** — raw, heavy, architectural. The kind of space that exists in editorial fashion shoots and art galleries in abandoned buildings.

- **Back wall:** Raw poured concrete — visible form-lines, aggregate texture, subtle imperfection. This is where the BA logo lives permanently as a physical engraving.
- **Floor:** Polished dark concrete — faint reflection, grounding the floating objects above it.
- **Sides:** Open — no walls. The world fades into atmospheric darkness at the edges.
- **Ceiling:** Not visible. Light comes from above but the source is never seen.
- **Lighting:** Dramatic but sparse. Two or three key spotlights hitting specific zones. The rest falls into shadow. Warm white, not golden.

### Ambient animation (always running, never distracting)
- Very slow breathing on key light intensity (barely perceptible)
- Product objects and category objects have a gentle idle float — different sine frequencies so nothing moves in sync
- Dust particles in the air — extremely subtle, slow-moving, catch light
- Nothing pulses, flashes, or draws attention to itself unprompted

---

## 6. Navigation & HUD

### Always visible elements
- **BA logo** — top left. Always present. Clicking it returns the user to the Hero at any point in the experience. One tap, instant cut back.
- **Search icon** — top right. Opens a **side search panel** that slides in over the 3D world. User can search products by name. Results appear as a list with image, name, price — clicking one navigates directly to that product's 3D detail view.

### What is NOT in the HUD
No hamburger menus. No full navigation bar. No breadcrumbs in the header. Navigation happens through the world itself — the HUD is minimal by design.

### Search panel
- Slides in from the right
- Semi-transparent dark background — the 3D world remains visible behind it
- Text input, results list
- Each result: product image thumbnail + name + price
- Click result → camera navigates to that product's detail view directly

---

## 7. Scroll Flow — The Five Sections

The site is one continuous vertical scene. Scroll moves the camera downward. There are five distinct zones.

```
ZONE 1 — HERO
ZONE 2 — CATEGORY SHOWCASE  
ZONE 3 — COLLECTION ARRAY  (entered via click, not scroll)
ZONE 4 — PRODUCT DETAIL    (entered via click, not scroll)
```

Zones 3 and 4 are not scrolled into — they are entered via interaction. The scroll axis covers Zones 1 and 2 only. Everything deeper is accessed by clicking.

---

## 8. Zone 1 — Hero

**Camera position:** Frontal, centered on the back wall. Slightly elevated — looking very slightly downward.

**What is visible:**
- The back concrete wall fills most of the frame
- The BA logo is engraved/embossed into the wall — physically part of it, not a texture overlay
- Below the logo, the brand message is engraved in thinner, smaller text:
  *"Where beauty is etched into art"*
- Wide letter-spacing, thin weight
- A single dramatic spotlight hits the logo zone from above
- The floor is visible at the bottom of the frame
- Dust particles drift through the light beam

**Scroll behavior:**
After approximately 15–20% of scroll, the camera begins moving downward toward Zone 2. The logo wall recedes upward out of frame. Transition is smooth, eased.

---

## 9. Zone 2 — Category Showcase

This is not a selection menu. It is a showcase — each category has its own moment and description before the user chooses to enter it.

### Web layout
All four categories are **visible simultaneously on screen** — arranged on the stage like objects in an exhibition. Each takes up roughly one quarter of the horizontal space. The camera is pulled back slightly compared to the hero to accommodate all four.

Each category occupies its own "station" — a concrete plinth or surface, with the category's representative 3D object floating above it and text below.

### Mobile layout
Categories are shown as **full-screen vertical pages** — one per scroll step. The user scrolls up/down through them one at a time. Each category fills the full screen with its 3D object and description. An "Enter Collection" button appears below the description.

### What each category station shows

**3D object:** A representative product from that category, floating above the plinth. Gently rotating on its vertical axis. This is a real GLB model.

**Text (HTML overlay, positioned over the 3D scene):**
- Category name — large, wide tracking
- A short paragraph (2–4 sentences) describing the collection's identity and what makes it distinct
- "Enter" label or arrow — subtle, not a loud button

### The four categories
1. **Apparel** — graphic tees with street and pop art identity
2. **Wall Art** — 2D framed prints, stained glass style, posters
3. **Layered Art** — physical multi-layer panel art with real depth
4. **Digital Art** — digital prints and poster art

### Interaction
Clicking the "Enter" label or the 3D object itself triggers the transition into Zone 3 for that category.

---

## 10. Zone 3 — Collection Array

### Transition in
- The selected category's object grows and moves to the top-center of the screen as a small anchor — it stays visible so the user knows where they are
- The other three category stations slide off screen (left/right, not fade)
- The collection products float up from below into position

### Layout — Web
A **grid of product cards** — 3 or 4 columns depending on screen width. Each card is:
- Predominantly the **product image** — large, takes up most of the card
- Product name below in small text — thin, wide tracking
- Price below name
- Nothing else

Cards float gently. Minimal. The product image is the hero of each card.

### Layout — Mobile
Two columns. Same card structure. Scroll vertically through the grid.

### Collection navigation
- Within the collection, a minimal label at the top shows which sub-collection is active (e.g. "Naruto" within Wall Art)
- If a category has sub-collections (e.g. Wall Art has Naruto, Dragon Ball, Islamic, etc.), a horizontal filter strip appears above the grid — text labels only, no buttons or pill shapes. Clicking a label filters the grid.
- The BA logo in the HUD returns to hero. A separate "← Collections" text label (not in the HUD — floating near the top of the scene) returns to Zone 2.

### Interaction
Clicking a product card triggers transition to Zone 4.

---

## 11. Zone 4 — Product Detail

### Transition in
The clicked product card punches forward — it scales up toward the camera and expands. The grid falls away. The product GLB model takes over the left side of the screen.

### Web layout

**Left side (~60% of screen) — 3D Product Viewer:**
- The product's GLB model rendered in full
- Auto-rotates slowly on Y axis when idle
- User can click and drag to orbit manually — single axis preferred (Y only) to keep it controlled
- Pinch to zoom on touch
- Lighting: 3-point setup — warm key from top-left, cool fill from right, subtle rim from behind
- Background: the concrete environment is still dimly visible — the product is not isolated on black

**Right side (~40% of screen) — Shopify UI Panel:**
- Semi-transparent dark panel overlaying the world
- Product name — large
- Price in PKR
- Short description (pulled from Shopify)
- Variant selector — the primary variant type for that product (size for apparel, size/material for wall art, size for layered art)
  - Displayed as minimal labeled chips — thin border, text only
  - Active variant: border lights up in warm white
- **Changing a variant updates the 3D model in real time** — texture swap or model swap depending on the variant type
- "Add to Cart" — opens Shopify checkout in new tab
- "Order via WhatsApp" — wa.me link with product pre-filled in message
- "← Back to Collection" text link

### Mobile layout — Product Detail
The 3D product viewer takes the **full screen**. The UI does not have a side panel.

Instead the UI is **game-like and minimal:**
- Product name + price: top of screen, semi-transparent, thin text
- Variant selector: right side of screen, vertical stack of minimal chips
- Add to Cart: bottom center — minimal, semi-transparent button
- WhatsApp: bottom right — icon only
- Back: top left — small arrow

All UI elements are semi-transparent so the 3D product remains the focus. The user can still orbit the product by dragging anywhere on screen that isn't a UI element.

---

## 12. Blender Asset List

### Environment (one main GLB)
| Asset | Description |
|---|---|
| Concrete back wall | Raw poured concrete, form-lines, full scene backdrop |
| Floor | Dark polished concrete with faint reflection |
| BA logo engraving | Physical geometry — letters recessed into wall surface |
| Tagline engraving | Thinner geometry below logo |
| Spotlight rigs | Light geometry (visible cone optional) |
| Category plinths × 4 | Concrete platforms/surfaces for category stations |
| Dust particle system | Subtle slow-moving particles in light beams |

### Category hero objects (separate GLBs)
| Category | Hero Object |
|---|---|
| Apparel | One t-shirt model, posed naturally |
| Wall Art | A framed artwork panel |
| Layered Art | A layered panel showing depth |
| Digital Art | A backlit screen/frame |

### Product GLBs (per product)
- One GLB per product
- Variant differences handled via texture swap where possible (one mesh, multiple materials)
- For layered art: individual layer meshes within one GLB to allow layer-reveal animation
- For apparel: one base mesh per shirt style, texture atlas per design variant
- For wall art / digital art: flat panel with beveled frame, texture per artwork

### Export standards
- Format: GLB (binary glTF)
- Draco compression on all geometry
- Textures: KTX2 / Basis Universal where possible
- Scale: 1 Blender unit = 1 meter
- Origin: centered at object center
- All transforms applied before export
- No loose materials or missing UV maps

---

## 13. Shopify Integration

**Store:** blackaestheticspk.myshopify.com
**API:** Storefront API, GraphQL, version 2024-01+
**Access:** Public Storefront API token required

### Data pulled from Shopify
- All products: handle, title, description, price, images, variants
- Collections: title, products within
- Variant availability (in stock / out of stock)

### Variant → 3D mapping
A client-side config file maps each Shopify variant ID (or option value) to a texture file or GLB swap. This is maintained manually and updated when new products are added.

### Cart flow
- "Add to Cart" constructs a Shopify checkout URL with the selected variant
- Opens in a new browser tab
- The 3D experience remains open in the original tab

---

## 14. Performance Targets

| Metric | Target |
|---|---|
| Time to hero visible | < 3s on 4G |
| Environment GLB size | < 6MB after Draco |
| Per-product GLB size | < 2MB |
| Frame rate | 60fps desktop, 30fps+ mobile |
| Mobile support | Full — iOS Safari, Android Chrome |

### Loading strategy
1. Splash (BA logo on white) shows while environment GLB loads
2. Cut to 3D world the moment environment is ready
3. Category hero GLBs load in background while user is in Zone 2
4. Product GLBs load on demand when collection is entered
5. Individual product GLB loads on demand when product is clicked

---

## 15. What Is Explicitly Out of Scope (for now)

- No walkable / first-person camera mode
- No multi-language support
- No embedded cart drawer — checkout goes to Shopify
- No user accounts within the 3D experience
- No AR / WebXR
- No video backgrounds or video products
- No animations triggered by microphone or device motion

---

## 16. Open Decisions (to resolve before build)

| # | Question |
|---|---|
| 1 | Hosting: Vercel standalone site linked from Shopify, or Shopify Hydrogen custom storefront? |
| 2 | Will all product GLBs be modeled in Blender by you, or will some use photography-based textures on simple meshes? |
| 3 | Loading screen: show a progress bar/percentage, or just the BA logo until ready? |
| 4 | Sub-collection filter in Zone 3: how granular? (e.g. Wall Art has 10+ sub-collections — show all or group them?) |
| 5 | Layered art products: should the layers animate (reveal one by one) in the product detail view? |
