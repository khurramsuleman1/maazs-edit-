# Blender Source Workflow

The shared Blender source file is:

```text
BA All DATA/All Multilayer Art-3/BAstore.blend
```

This file is tracked with Git LFS because it is a large binary file. Keep it at this exact path; project docs, web parity notes, and Blender handoffs reference it directly.

## First-Time Designer Setup

1. Install Git LFS:

   ```bash
   git lfs install
   ```

2. Clone or pull this repository.
3. Fetch the Blender binary:

   ```bash
   git lfs pull
   ```

4. Open `BAstore.blend` in Blender. The source scenes are `BA_SINGLE_WALL_HOME` and `BA_PRODUCTS`.

## Updating The Blender Source

Before editing:

```bash
git pull --ff-only
git lfs pull
```

After editing:

```bash
git status
git add "BA All DATA/All Multilayer Art-3/BAstore.blend"
git commit -m "Update BAstore Blender source"
git push origin main
```

Back in this workspace, update the local copy with:

```bash
git pull --ff-only
git lfs pull
```

## Rules

- Only one person should edit `BAstore.blend` at a time. Blender files are binary and cannot be merged safely.
- Do not rename or move `BAstore.blend`.
- Do not commit `.blend1` or `.blend2` backup files; they are ignored.
- A Blender update does not automatically approve web assets. The asset gate in `AGENTS.md §2` still applies before any authored 3D geometry is exported or wired into `src/`.
