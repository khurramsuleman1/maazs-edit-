# Black Aesthetics — 3D Virtual Store

A scroll-driven, cinematic 3D storefront for **blackaestheticspk.com**.
Built with Vite + Three.js, environment authored in Blender, products from Shopify.

> **"Where beauty is etched into art."** · Concrete is the world. Black is the product.

---

## For humans

- **What we're building:** see [`ba_spec_v2.md`](./ba_spec_v2.md) — the full product spec.
- **Where the project stands right now:** see [`docs/STATUS.md`](./docs/STATUS.md).
- **How the two AIs work together:** see [`AGENTS.md`](./AGENTS.md).

## For AI agents (Claude & Codex)

Read [`AGENTS.md`](./AGENTS.md) first, every session. The loop is:
**Read `docs/STATUS.md` → ask if unclear → work → update STATUS + CHANGELOG.**

The asset pipeline has a **hard gate**: nothing reaches the website until its
Blender render is approved by Master Khurram (`AGENTS.md §2`).

## Run it

```bash
npm install
cp .env.example .env   # then fill in your Shopify token
npm run dev            # http://localhost:5173
```

## Layout

```
docs/      communication system (STATUS, DECISIONS, ASSETS, CHANGELOG)
src/       website code (scene / controllers / shopify / ui)
assets/    blender sources, renders (pending/approved), glb exports, textures
public/    static files
```

Existing source art (`2D Art All SVG/`, `BA All DATA/`, the master `.blend`)
stays where it is for now — see `AGENTS.md §5`.
