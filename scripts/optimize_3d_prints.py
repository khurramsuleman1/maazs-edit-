# Headless Blender script: decimate heavy 3D-print STL sources to browser-safe STLs.
# Run: blender -b -P scripts/optimize_3d_prints.py
# Sources stay untouched; outputs land in public/products/3d/ (web product data, not gated
# authored assets — AGENTS.md section 2 note).
import bpy
import os
import json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "BA All DATA", "3D Print Models")
OUT = os.path.join(ROOT, "public", "products", "3d")

# (source relative to SRC, output name, target triangle count)
JOBS = [
    ("Mini Joker 80mm/joker-stl.stl", "mini-joker.stl", 26000),
    ("Mini Superman 80mm/superman-normal-v4-stl-1.stl", "mini-superman.stl", 26000),
    ("Lamp-Shade/Base/Lamp-Base.stl", "lamp-base.stl", 16000),
    ("Lamp-Shade/Top/LED Lamp 001-1.stl", "led-lamp-shade.stl", 20000),
    ("Batman Files/Batman Figure 130mm/Batman Figure.stl", "batman-figure-130mm.stl", 26000),
    ("Batman Files/Batman Stand 150mm/Batman_Stand.stl", "batman-stand-150mm.stl", 24000),
    ("Batman Files/Mini Batman 90mm/final-batman-v3.stl", "mini-batman-90mm.stl", 26000),
    ("Batman Files/Mini Armored Batman 90mm/armored-batman-v2-stl (1).stl", "mini-armored-batman-90mm.stl", 26000),
]

report = []


def clear_scene():
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.object.delete()
    for mesh in list(bpy.data.meshes):
        if mesh.users == 0:
            bpy.data.meshes.remove(mesh)


def import_stl(path):
    if hasattr(bpy.ops.wm, "stl_import"):
        bpy.ops.wm.stl_import(filepath=path)
    else:
        bpy.ops.import_mesh.stl(filepath=path)
    return [o for o in bpy.context.selected_objects if o.type == "MESH"]


def export_stl(path):
    if hasattr(bpy.ops.wm, "stl_export"):
        bpy.ops.wm.stl_export(filepath=path, export_selected_objects=True)
    else:
        bpy.ops.export_mesh.stl(filepath=path, use_selection=True)


for rel, out_name, target in JOBS:
    src = os.path.join(SRC, rel)
    dst = os.path.join(OUT, out_name)
    entry = {"src": rel, "out": out_name}
    try:
        if not os.path.exists(src):
            entry["error"] = "missing source"
            report.append(entry)
            continue
        clear_scene()
        objects = import_stl(src)
        if not objects:
            entry["error"] = "import produced no mesh"
            report.append(entry)
            continue
        # Join multi-part imports into one mesh.
        bpy.context.view_layer.objects.active = objects[0]
        for o in objects:
            o.select_set(True)
        if len(objects) > 1:
            bpy.ops.object.join()
        obj = bpy.context.view_layer.objects.active
        tris = len(obj.data.loop_triangles) or sum(len(p.vertices) - 2 for p in obj.data.polygons)
        entry["tris_in"] = tris
        if tris > target:
            mod = obj.modifiers.new("dec", "DECIMATE")
            mod.ratio = target / tris
            bpy.ops.object.modifier_apply(modifier=mod.name)
        entry["tris_out"] = sum(len(p.vertices) - 2 for p in obj.data.polygons)
        obj.select_set(True)
        export_stl(dst)
        entry["bytes"] = os.path.getsize(dst)
    except Exception as exc:  # noqa: BLE001
        entry["error"] = str(exc)
    report.append(entry)

with open(os.path.join(ROOT, "scripts", "optimize_3d_prints_report.json"), "w") as fh:
    json.dump(report, fh, indent=2)
print("DONE", json.dumps(report))
