"""Export layered Blender products as per-layer SVG cut paths.

Run inside Blender with BAstore.blend open. The script reads the approved
source layer objects, extracts the top-face boundary loops, and writes a stable
SVG stack for the Three.js runtime to extrude in-browser.
"""

from __future__ import annotations

from collections import defaultdict
from pathlib import Path
import math
import re

import bpy
from mathutils import Vector


PROJECT_ROOT = Path("/Users/mac/Documents/Codex/BlackAestheticspk")
OUTPUT_ROOT = PROJECT_ROOT / "public" / "products" / "layered" / "svg"

EXPORTS = {
    "wolf": {
        "collection": "Multilayer 3D Wolf",
        "objects": ["Curve.001", "Curve.005", "Curve.006", "Curve.007"],
    },
    "bear": {
        "collection": "Bear Wall Decor Geometric Layered Art ",
        "objects": ["Curve", "Curve.002", "Curve.003", "Curve.004", "Curve.011", "Curve.014"],
    },
    "mandala": {
        "collection": "Wooden Multilayer 3D Mandala",
        "objects": ["Layer 1", "Layer 2", "Layer 3", "Layer 4", "Layer 5", "Layer 6"],
    },
    "eclipse-mandala": {
        "collection": "Multilayered-mandala",
        "objects": ["_1", "_2", "_3", "_4", "_5", "_6"],
    },
    "motorcycle": {
        "collection": "Multilayered Motorcycle wall Art",
        "objects": ["Curve.008", "Curve.009", "Curve.010", "Curve.012", "Curve.013"],
    },
}


def natural_key(value: str) -> list[object]:
    return [int(chunk) if chunk.isdigit() else chunk.lower() for chunk in re.split(r"(\d+)", value)]


def polygon_area(points: list[tuple[float, float]]) -> float:
    area = 0.0
    for index, point in enumerate(points):
        nxt = points[(index + 1) % len(points)]
        area += point[0] * nxt[1] - nxt[0] * point[1]
    return area * 0.5


def remove_duplicate_points(points: list[tuple[float, float]], precision: int = 3) -> list[tuple[float, float]]:
    cleaned: list[tuple[float, float]] = []
    for x, y in points:
        point = (round(x, precision), round(y, precision))
        if cleaned and cleaned[-1] == point:
            continue
        cleaned.append(point)
    if len(cleaned) > 1 and cleaned[0] == cleaned[-1]:
        cleaned.pop()
    return cleaned


def simplify_collinear(points: list[tuple[float, float]], epsilon: float = 0.0015) -> list[tuple[float, float]]:
    if len(points) < 4:
        return points
    simplified: list[tuple[float, float]] = []
    for index, current in enumerate(points):
        prev = points[index - 1]
        nxt = points[(index + 1) % len(points)]
        area = abs((current[0] - prev[0]) * (nxt[1] - prev[1]) - (current[1] - prev[1]) * (nxt[0] - prev[0]))
        length = math.hypot(nxt[0] - prev[0], nxt[1] - prev[1])
        if length == 0 or area / length > epsilon:
            simplified.append(current)
    return simplified


def edge_key(a: int, b: int) -> tuple[int, int]:
    return (a, b) if a < b else (b, a)


def build_loops(boundary_edges: list[tuple[int, int]]) -> list[list[int]]:
    adjacency: dict[int, list[int]] = defaultdict(list)
    remaining = {edge_key(a, b) for a, b in boundary_edges}
    for a, b in remaining:
        adjacency[a].append(b)
        adjacency[b].append(a)

    loops: list[list[int]] = []
    while remaining:
        start_a, start_b = next(iter(remaining))
        remaining.remove(edge_key(start_a, start_b))
        loop = [start_a, start_b]
        previous = start_a
        current = start_b

        for _ in range(len(boundary_edges) + 4):
            if current == start_a:
                break
            candidates = [node for node in adjacency[current] if edge_key(current, node) in remaining]
            if not candidates:
                break
            next_node = candidates[0]
            if len(candidates) > 1:
                next_node = next((node for node in candidates if node != previous), candidates[0])
            remaining.remove(edge_key(current, next_node))
            previous, current = current, next_node
            loop.append(current)

        if len(loop) > 3:
            if loop[-1] == loop[0]:
                loop.pop()
            loops.append(loop)
    return loops


def projection_axes(obj: bpy.types.Object, mesh: bpy.types.Mesh) -> tuple[int, int, int]:
    coords = [obj.matrix_world @ vertex.co for vertex in mesh.vertices]
    mins = [min(coord[axis] for coord in coords) for axis in range(3)]
    maxs = [max(coord[axis] for coord in coords) for axis in range(3)]
    sizes = [maxs[axis] - mins[axis] for axis in range(3)]
    thin_axis = min(range(3), key=lambda axis: sizes[axis])
    plane_axes = [axis for axis in range(3) if axis != thin_axis]
    return plane_axes[0], plane_axes[1], thin_axis


def extract_layer_loops(obj: bpy.types.Object) -> tuple[list[list[tuple[float, float]]], tuple[int, int, int]]:
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    mesh.calc_loop_triangles()
    mesh.update(calc_edges=True)

    axis_u, axis_v, thin_axis = projection_axes(obj, mesh)
    normal_matrix = obj.matrix_world.to_3x3().inverted().transposed()
    top_faces = set()
    for polygon in mesh.polygons:
        normal = (normal_matrix @ polygon.normal).normalized()
        if normal[thin_axis] > 0.5:
            top_faces.add(polygon.index)

    edge_to_faces: dict[tuple[int, int], list[int]] = defaultdict(list)
    for polygon in mesh.polygons:
        for key in polygon.edge_keys:
            edge_to_faces[edge_key(*key)].append(polygon.index)

    boundary_edges = []
    for key, face_indices in edge_to_faces.items():
        top_count = sum(1 for face_index in face_indices if face_index in top_faces)
        if top_count and top_count < len(face_indices):
            boundary_edges.append(key)
        elif top_count and len(face_indices) == 1:
            boundary_edges.append(key)

    loops = []
    for loop_indices in build_loops(boundary_edges):
        points = []
        for vertex_index in loop_indices:
            coord = obj.matrix_world @ mesh.vertices[vertex_index].co
            points.append((float(coord[axis_u]), float(coord[axis_v])))
        points = simplify_collinear(remove_duplicate_points(points))
        if len(points) >= 3 and abs(polygon_area(points)) > 0.0001:
            loops.append(points)

    evaluated.to_mesh_clear()
    loops.sort(key=lambda item: abs(polygon_area(item)), reverse=True)
    return loops, (axis_u, axis_v, thin_axis)


def path_from_loops(loops: list[list[tuple[float, float]]], bounds: tuple[float, float, float, float]) -> str:
    min_u, min_v, max_u, max_v = bounds
    commands = []
    for loop in loops:
        points = [(x - min_u, max_v - y) for x, y in loop]
        if len(points) < 3:
            continue
        first = points[0]
        commands.append(f"M {first[0]:.3f} {first[1]:.3f}")
        for point in points[1:]:
            commands.append(f"L {point[0]:.3f} {point[1]:.3f}")
        commands.append("Z")
    return " ".join(commands)


def write_svg(path: Path, loops: list[list[tuple[float, float]]], bounds: tuple[float, float, float, float]) -> None:
    min_u, min_v, max_u, max_v = bounds
    width = max(max_u - min_u, 1e-6)
    height = max(max_v - min_v, 1e-6)
    svg_path = path_from_loops(loops, bounds)
    path.write_text(
        "\n".join(
            [
                f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:.3f} {height:.3f}">',
                f'  <path d="{svg_path}" fill="#111111" fill-rule="evenodd"/>',
                "</svg>",
                "",
            ]
        ),
        encoding="utf-8",
    )


def collection_objects(collection_name: str, names: list[str]) -> list[bpy.types.Object]:
    collection = bpy.data.collections.get(collection_name)
    if collection is None:
        raise RuntimeError(f"Missing collection: {collection_name}")
    by_name = {obj.name: obj for obj in collection.objects}
    missing = [name for name in names if name not in by_name]
    if missing:
        raise RuntimeError(f"Missing objects in {collection_name}: {', '.join(missing)}")
    return [by_name[name] for name in names]


def export_product(product_id: str, spec: dict[str, object]) -> dict[str, object]:
    objects = collection_objects(str(spec["collection"]), list(spec["objects"]))
    layers = []
    all_points = []

    for obj in objects:
        loops, axes = extract_layer_loops(obj)
        if not loops:
            raise RuntimeError(f"No top-face loops extracted from {obj.name}")
        layers.append({"object": obj.name, "loops": loops, "axes": axes})
        for loop in loops:
            all_points.extend(loop)

    min_u = min(point[0] for point in all_points)
    min_v = min(point[1] for point in all_points)
    max_u = max(point[0] for point in all_points)
    max_v = max(point[1] for point in all_points)
    bounds = (min_u, min_v, max_u, max_v)

    product_dir = OUTPUT_ROOT / product_id
    product_dir.mkdir(parents=True, exist_ok=True)
    for index, layer in enumerate(layers, start=1):
        write_svg(product_dir / f"layer-{index:02d}.svg", layer["loops"], bounds)

    return {
        "product": product_id,
        "layers": len(layers),
        "loops": sum(len(layer["loops"]) for layer in layers),
        "bounds": tuple(round(value, 3) for value in bounds),
        "axes": layers[0]["axes"],
    }


def main() -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    results = [export_product(product_id, spec) for product_id, spec in EXPORTS.items()]
    print("Layered SVG export complete:")
    for result in results:
        print(result)


if __name__ == "__main__":
    main()
