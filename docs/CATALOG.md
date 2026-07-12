# CATALOG — Black Aesthetics product structure (reference)

> Originally pulled live from Shopify Admin on 2026-06-22.
> Current per-product launch alignment was generated on 2026-07-12 in
> `docs/SHOPIFY_PRODUCT_ALIGNMENT.json`; use that JSON for handles, variants, prices,
> collection ordering, and match confidence.
> Store: blackaestheticspk.com · PKR · 38 collections in the latest pull.

The current web storefront has **4 active navigation categories** after D26 removed Apparel from
the active experience: Wall Art, Digital Art, Layered Art, and 3D Objects. Apparel remains in
Shopify and is listed here as inactive structure. Shopify's collections map into them below.

Latest local runtime catalog: **198 products** — 148 Wall Art, 30 Digital Art, 5 Layered Art, and
15 3D Objects. Latest Shopify alignment: **506 products** total, **173 local matches**, **25
local-only**, **340 live products not yet represented in the 3D site**.

**3D treatment per category (DECISIONS D07–D11):**
- **Apparel** → dummy placeholder object.
- **Wall Art** → laser-cut look; thickened meshes already exist in the master `.blend`.
- **Digital Art** → flat poster panel, artwork as texture on one side.
- **Layered Art** → multi-layer depth panels (true layered meshes).
- **3D Objects** → real 3D models from the print files.
First build = ONE hero object per category (5 total), not per-product. Each Shopify "theme" (Anime, Islamic, etc.) generally exists in two
mediums — a **`- 2D`** version (physical framed/metal wall art) and a **`- Digital Art`**
version (poster/print) — plus a parent collection holding both.

Status legend for 3D: `DUMMY` = placeholder object · `FILES` = source files on disk ·
`TBD` = mapping/scope not yet confirmed.

---

## 1. APPAREL  → inactive in current web nav (D26) · 3D: **DUMMY if restored later**
| Collection | Handle | Products | GID |
|---|---|---:|---|
| Apparel | apparel | 41 | 295595901027 |
| T-Shirts- Abstract | t-shirts-abstract | 11 | 295596195939 |
| T-Shirts- Contrast Whisper | contract-whisper | 20 | 295597342819 |
| T-Shirts- Pop Art | t-shirts-pop-art | 10 | 295597768803 |
| T-Shirts- Doodle Art | t-shirts-doodle-art | 0 | 295597604963 |

## 2. WALL ART  → nav category "Wall Art" (physical 2D framed / metal)  · 3D: **FILES**
Umbrella + themed sub-collections (shown as the filter strip in Zone 3, spec §10).
| Collection | Handle | Products | GID |
|---|---|---:|---|
| 2D Wall-Art (umbrella) | 2d-wallart | 192 | 276274217059 |
| Animals | animal-2d-wall-art | 54 | 276867317859 |
| Anime/Manga | anime-mangaall | 91 | 276977385571 |
| Anime/Manga- 2D | anime-manga-2d-1 | 10 | 290175975523 |
| Comics and Superheroes | comics-and-superheroes-2d | 24 | 276977418339 |
| Comics/Superheroes/Movies- 2D | comics-superheroes-2d | 14 | 290176172131 |
| Cultural Arts | cultural-arts | 12 | 287777783907 |
| Cultural Arts- 2D | cultural-arts-2d | 8 | 290175713379 |
| Islamic Art | islamic | 53 | 286313218147 |
| Islamic Art- 2D | islamic-art-2d | 29 | 290176696419 |
| Maths and Nature | maths-and-nature | 27 | 276977582179 |
| Minimalistic and Classical Art | minimalistic | 42 | 276977614947 |
| Modern Art | modern-culture | 70 | 276979875939 |
| Movies | movies | 37 | 276978991203 |
| Personalities | personalities | 20 | 276977778787 |
| Cars | cars | 16 | 287068651619 |
| Dragon Ball | dragon-ball-z | 6 | 287068749923 |
| Naruto | naruto | 69 | 290272870499 |
| Ronaldo | ronaldo | 5 | 290207694947 |
| Smoking Lady | smoking-lady | 36 | 291851993187 |
| Stained Glass Style | stained-glass-style | 12 | 288320651363 |
| Warrior Ladies | warrior-ladies | 20 | 293860474979 |

## 3. DIGITAL ART  → nav category "Digital Art" (posters / digital prints)  · 3D: **FILES**
| Collection | Handle | Products | GID |
|---|---|---:|---|
| Digital Art (umbrella) | poster-art | 240 | 277622194275 |
| Anime/Manga- Digital Art | anime | 83 | 290176008291 |
| Comics/Superheroes/Movies- Digital Art | comics-superheroes-movies-digital-ae | 19 | 290176237667 |
| Cultural Arts- Digital | cultural-arts-digital | 17 | 290175844451 |
| Islamic Art- Digital Art | islamic-art-digital-art | 24 | 290176729187 |

## 4. LAYERED ART  → nav category "Layered Art" (multi-layer depth panels)  · 3D: **FILES**
| Collection | Handle | Products | GID |
|---|---|---:|---|
| Layered Art | layered-art | 8 | 293701386339 |

---

## 5. 3D OBJECTS  → nav category "3D Objects"  · 3D: **FILES (real decimated models)**
Real 3D products. Print/model files in `BA All DATA/3D Print Models/`.
| Collection | Handle | Products | GID |
|---|---|---:|---|
| 3D Prints | 3d-prints | 13 | 292880810083 |
| Lamps | lamps | 8 | 293701484643 |
| Accessories | accessories | 2 | 293701615715 |

## Merchandising collections (cross-category, NOT navigation)
Used for "featured" rails, not as a browse category.
| Collection | Handle | Products | GID |
|---|---|---:|---|
| Best Sellers | best-seller | 38 | 286312890467 |
| New Arrivals | new-arrivals | 68 | 286313185379 |

---

## Source files on disk (for 3D asset prep)
| Category | Source folder | Contents |
|---|---|---|
| Wall Art / Digital Art line art | `2D Art All SVG/` | 148 SVGs |
| Wall Art raster | `BA All DATA/2D Art/` | numbered PNGs |
| Digital Art / posters | `BA All DATA/Poster prints/` | Anime, Comics & Superheroes, Digital Art, Fighting Girls, Islamic, Minimalistic, Smoky Lady |
| 3D Prints | `BA All DATA/3D Print Models/` | Batman Files, Fidget-Spinner, Lamp-Shade, Mini Joker/Superman 80mm, Poster Frame Corner Holder, flexi cat, panther |
| Brand | `LOGO Blackaesthetics.svg` | BA logo |
| Master 3D | `BA All DATA/All Multilayer Art-3/BAstore.blend` | source of truth scenes `BA_SINGLE_WALL_HOME` + `BA_PRODUCTS` |
| Shopify alignment | `docs/SHOPIFY_PRODUCT_ALIGNMENT.json`, `docs/BA_PRODUCT_LOG.xlsx` | current live product/variant/collection export and local mapping |
| Apparel | — | inactive in current web nav; no source model |
