# MCP Connection Notes

Date: 2026-06-24

## Blender MCP State

- Blender itself is healthy and listening on `127.0.0.1:9876`.
- The active Blender 5.1 lab MCP add-on expects null-byte-delimited requests:
  `{"type":"execute","code":"...","strict_json":false}\0`
- The older `blender-mcp` wrapper was sending raw JSON with `type: "execute_code"` and no null delimiter.
  That caused `Incomplete JSON response received` / `NO_DATA` symptoms.
- Direct socket tests with the Blender 5.1 lab protocol returned `BA_GALLERY` correctly.

## Local Wrapper Patch

Patched local wrapper:

```text
/Users/mac/.cache/uv/archive-v0/zVlTA7xSzwHIuFEOFuTRA/lib/python3.13/site-packages/blender_mcp/server.py
```

Patch behavior:
- Reads null-byte-delimited responses.
- Sends null-byte-delimited requests.
- Translates common tool calls (`execute_code`, `get_scene_info`, `get_object_info`) into Blender 5.1 lab
  `execute` requests.

## Recovery

If Codex's `mcp__blender` tools say `Transport closed`, restart/reload the Codex Blender MCP connector or
restart the Codex app/session so the wrapper respawns from the patched file.

Do not treat this as a Blender scene problem. The Blender socket responds correctly when called with the
new protocol.
