# AGENTS.md — Operating Protocol for Black Aesthetics

> Read this file first, every session. It is the single contract for whoever is
> working in this workspace.
> Project: **blackaestheticspk.com** — a scroll-driven 3D virtual storefront.

---

## 0. One operator, two bodies

Claude and Codex are **one continuous operator** working on this project, never at
the same time. Whoever is running *is* "the agent." There is no handoff negotiation,
no locking, no ownership split — only one worker that happens to wake up in different
tools. `docs/STATUS.md` is the memory that carries across those wake-ups.

So: don't address "the other AI," don't claim files against contention, don't ask who
owns what. Just read the state, continue the work, and leave the state correct for
next time.

Use whichever toolset fits the job: Blender MCP + vision for modeling/asset/review
work, code tools for the Three.js/Vite/Shopify website. Same operator, right tool.

---

## 1. The loop (this is the whole job)

1. Read `docs/STATUS.md` — the live state (now / next / blocked). Trust it over memory.
2. Read `docs/DECISIONS.md` only if you need a locked design/tech decision.
3. Full product spec is `ba_spec_v2.md` (root). Read it for zone/asset/behavior detail.
   Don't restate it elsewhere — link to `ba_spec_v2.md §X`.
4. Anything ambiguous in the task? **Ask first (§3).**
5. Do the work. Respect the asset gate (§2).
6. Before finishing: **rewrite `docs/STATUS.md`** to reflect reality and **append one
   line to `docs/CHANGELOG.md`.** Mandatory — this is the only memory across sessions.

**Read STATUS → work → update STATUS + log.**

---

## 2. The Asset Pipeline — HARD GATE (non-negotiable)

Every visual asset follows this path. **Nothing skips a stage.**

```
  [1] BLENDER          [2] SET CAMERA       [3] APPROVAL          [4] WEB
  Model/author    →    Frame it + tell  →   Master Khurram   →    Export GLB / use,
  in .blend            Khurram to look      reviews IN BLENDER    wire into site
                       in the viewport      & says "approved"
```

**Rule: no asset reaches the website until Master Khurram has personally seen it in
Blender and approved it.** This is the hard gate.

- Do NOT produce renders (D14). After authoring, set up the review **camera/viewport**
  framing the asset, then tell Master Khurram what to look at. He inspects live.
- Log status in `docs/ASSETS.md` as `STAGED — awaiting review`.
- **Stop and wait for "approved".** On approval: mark `APPROVED` in `ASSETS.md`, then
  export/wire it. Only an `APPROVED` asset may be referenced in `src/`.
- If unsure whether something is approved, check `ASSETS.md`. Not marked `APPROVED` =
  not approved.

Note: image-based products (posters, wall-art silhouettes, layered fronts) that use
existing photos/SVGs as textures are data, not new Blender assets — they don't need the
gate. The gate is for authored 3D geometry destined for the site as GLB.

---

## 3. Ask before you act (default behavior)

Master Khurram wants questions, not assumptions. **If a prompt is ambiguous, missing
detail, or has more than one reasonable reading — ask first.** Prefer a few sharp
multiple-choice questions over open-ended ones.

Ask before executing when any of these are true:
- Deliverable format, scope, or location is unclear.
- A design/tech choice isn't already locked in `DECISIONS.md`.
- The action deletes, moves, or overwrites existing files.
- The action touches money, Shopify checkout, live deployment, or domain config.
- You'd be making a creative judgment call not in the spec.

Don't ask about trivial, reversible, clearly-specified steps — just do those.

---

## 4. The memory system (four files in `docs/`)

| File | Purpose | Read when | Write when |
|---|---|---|---|
| `STATUS.md` | **Live state.** Now / Next / Blocked. | **Every session, first.** | **Every session, before finishing.** |
| `DECISIONS.md` | Locked choices (tech + design). Append-only, terse. | When you need a settled decision. | When a decision gets locked. |
| `ASSETS.md` | Asset pipeline table + gate status. | Before touching any asset. | When an asset changes stage. |
| `CHANGELOG.md` | Append-only one-line history. | Rarely — only for "what happened when". | One line, every session. |

**Why this shape:** `STATUS.md` is *rewritten* to stay short, so reading it is cheap and
always reflects reality. History lives in append-only `CHANGELOG.md`, opened only when
you need the past.

### Rules
- **STATUS.md is the source of truth.** If reality and STATUS disagree, fix STATUS.
- Keep STATUS short. Move finished items out of Now/Next — their record is the CHANGELOG line.
- CHANGELOG lines: `YYYY-MM-DD — [agent] — what changed`. One line. (`[agent]` = whichever
  body you are, for traceability — not because they're separate workers.)
- DECISIONS lines: `YYYY-MM-DD — D<NN>: decision — one-line rationale`.
- Never duplicate the spec. Link to `ba_spec_v2.md §X`.

---

## 5. Data arrangement (where things live)

```
BlackAestheticspk/
├── AGENTS.md              ← this file (read first)
├── CLAUDE.md              ← pointer to this file
├── README.md              ← human overview + how to run
├── ba_spec_v2.md          ← full product spec (source of truth for WHAT to build)
├── docs/                  ← the memory system
│   ├── STATUS.md  DECISIONS.md  ASSETS.md  CHANGELOG.md  CATALOG.md
├── src/                   ← website code (Three.js + Vite)
│   ├── main.js  scene/  controllers/  shopify/  data/  ui/
├── public/                ← static files served as-is (incl. products/ images)
├── assets/                ← blender/ · renders/ · glb/ (APPROVED only) · textures/
└── (existing source art — DO NOT move without asking)
    ├── 2D Art All SVG/   BA All DATA/   *.blend
```

**Existing art folders and the big .blend files stay where they are** — they reference
each other by path. Migration into `assets/` is a *proposed* future step in STATUS, done
only with approval.

---

## 6. Web / tech conventions

- Stack: Vite + Three.js (r155+), GLB/Draco assets, Shopify Storefront API. See `ba_spec_v2.md §3`.
- Run dev server: `npm install` then `npm run dev`.
- Keep secrets out of git: Shopify tokens go in `.env` (gitignored), never in `src/`.
- One file = one concern. Keep modules small. Comment the *why*, not the *what*.

---

## 7. Session checklist

- [ ] Read `docs/STATUS.md`.
- [ ] Task ambiguous? → **ask Master Khurram first (§3).**
- [ ] Do the work. Respect the asset gate (§2).
- [ ] Rewrite `STATUS.md` (Now/Next/Blocked).
- [ ] Append one line to `CHANGELOG.md`.
- [ ] Locked a decision? → `DECISIONS.md`. Asset changed stage? → `ASSETS.md`.
