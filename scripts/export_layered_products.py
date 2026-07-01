from pathlib import Path

import bpy


OUT_DIR = Path(__file__).resolve().parents[1] / "public" / "models" / "layered"
OUT_DIR.mkdir(parents=True, exist_ok=True)

PRODUCTS = {
    "wolf-layered": ("BA_REAL_WOLF_L",),
    "bear-layered": ("BA_LAYERED_BEAR_L",),
    "mandala-layered": ("BA_LAYERED_MANDALA_L",),
    "eclipse-mandala": ("BA_LAYERED_ECLIPSE_L",),
}

MATERIALS = [
    (0x050505, 0.52),
    (0x151515, 0.54),
    (0x2A2A2A, 0.56),
    (0x474747, 0.58),
    (0x626262, 0.6),
    (0x7A7A7A, 0.62),
]


def make_layer_material(index):
    color, roughness = MATERIALS[min(index, len(MATERIALS) - 1)]
    name = f"BA_WEB_LAYER_{index + 1:02d}"
    if name in bpy.data.materials:
        return bpy.data.materials[name]

    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        r = ((color >> 16) & 255) / 255
        g = ((color >> 8) & 255) / 255
        b = (color & 255) / 255
        bsdf.inputs["Base Color"].default_value = (r, g, b, 1)
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.06
    return material


def product_objects(prefixes):
    objects = []
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        if any(obj.name.startswith(prefix) for prefix in prefixes):
            objects.append(obj)
    return sorted(objects, key=lambda obj: obj.name)


def export_product(product_id, prefixes):
    bpy.ops.object.select_all(action="DESELECT")
    objects = product_objects(prefixes)
    if not objects:
        raise RuntimeError(f"No Blender layer objects found for {product_id}: {prefixes}")

    for index, obj in enumerate(objects):
        obj.hide_set(False)
        obj.hide_viewport = False
        obj.hide_render = False
        obj.data.materials.clear()
        obj.data.materials.append(make_layer_material(index))
        obj.select_set(True)

    bpy.context.view_layer.objects.active = objects[0]
    output_path = OUT_DIR / f"{product_id}.glb"
    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        use_selection=True,
        export_format="GLB",
        export_apply=True,
        export_yup=True,
        export_lights=False,
        export_cameras=False,
        export_materials="EXPORT",
    )
    print(f"Exported {product_id}: {len(objects)} layers -> {output_path}")


for product_id, prefixes in PRODUCTS.items():
    export_product(product_id, prefixes)
