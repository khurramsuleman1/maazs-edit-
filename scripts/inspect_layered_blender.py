import bpy


print("SCENES")
for scene in bpy.data.scenes:
    print(f"- {scene.name}")

print("LAYERED CANDIDATES")
for obj in bpy.data.objects:
    name = obj.name.upper()
    if any(token in name for token in ("WOLF", "LAYER", "BEAR", "MANDALA", "ECLIPSE")):
        collections = ", ".join(collection.name for collection in obj.users_collection)
        print(
            f"{obj.name} | type={obj.type} | collections=[{collections}] "
            f"| hide={obj.hide_get()} | hide_viewport={obj.hide_viewport}"
        )
