import pathlib

import bpy


ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "models" / "ba-gallery-approved.glb"
SCENE_NAME = "BA_GALLERY"
COLLECTION_NAME = "BA_REAL_SCALE_LAYOUT"


def visible_mesh_light_camera_objects(collection):
    objects = []
    for obj in collection.all_objects:
        if obj.hide_get() or obj.hide_viewport or obj.hide_render:
            continue
        if obj.type in {"MESH", "CURVE", "FONT", "LIGHT", "CAMERA"}:
            objects.append(obj)
    return objects


def main():
    scene = bpy.data.scenes.get(SCENE_NAME)
    if scene is None:
        raise RuntimeError(f"Missing scene {SCENE_NAME}")
    bpy.context.window.scene = scene

    collection = bpy.data.collections.get(COLLECTION_NAME)
    if collection is None:
        raise RuntimeError(f"Missing collection {COLLECTION_NAME}")

    OUT.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    objects = visible_mesh_light_camera_objects(collection)
    for obj in objects:
        obj.select_set(True)

    if objects:
        bpy.context.view_layer.objects.active = objects[0]

    bpy.ops.export_scene.gltf(
        filepath=str(OUT),
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_materials="EXPORT",
        export_cameras=True,
        export_lights=True,
        export_yup=True,
        export_animations=False,
        export_extras=True,
    )
    print(f"Exported {len(objects)} approved gallery objects to {OUT}")


if __name__ == "__main__":
    main()
