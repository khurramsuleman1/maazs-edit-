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

## 2026-07-03 Codex Wrapper Fix

Root cause found again: `uvx blender-mcp` rotated to a fresh cache archive
(`/Users/mac/.cache/uv/archive-v0/pYgUGqnnRk_QgosksP45A/...`) that did not contain the
2026-06-24 lab-protocol patch. Blender itself was healthy; a direct socket request to
`127.0.0.1:9876` returned:

```text
{"status": "ok", "result": {"ok": true, "scene": "BA_SINGLE_WALL_HOME", "objects": 402}}
```

Permanent-ish fix applied:

- Stable patched launcher copied to:
  `/Users/mac/.codex/tools/blender-mcp-lab/bin/blender-mcp`
- Codex config now points at that stable launcher instead of `uvx blender-mcp`:
  `/Users/mac/.codex/config.toml` → `[mcp_servers.blender].command`
- Active uv cache copy also patched:
  `/Users/mac/.cache/uv/archive-v0/pYgUGqnnRk_QgosksP45A/lib/python3.13/site-packages/blender_mcp/server.py`

Patch behavior:

- Sends Blender 5.1 lab requests as null-byte-delimited
  `{"type":"execute","code":"...","strict_json":...}\0`.
- Reads responses up to the null-byte delimiter.
- Translates common old-wrapper calls (`execute_code`, `get_scene_info`,
  `get_object_info`, `get_polyhaven_status`) into lab-addon `execute` requests.
- Treats the lab addon socket as one-shot: Blender closes the client socket after each
  response, so the wrapper intentionally disconnects after every translated request and
  reconnects for the next command.

Verification after patch:

- `BlenderConnection.send_command("get_object_info", {"name": "PF_BAY_BIG"})` returned
  `location [-2.55, -0.08, 1.735]`.
- `send_command("get_scene_info")` returned active scene `BA_SINGLE_WALL_HOME`, file
  `BAstore.blend`, object count `402`.
- Global `get_blender_connection()` path successfully queried `PF_LOGO` then `PF_TRACK`
  across separate reconnects.

Claude's extension wrapper at
`/Users/mac/Library/Application Support/Claude/Claude Extensions/ant.dir.gh.blender.blender-mcp/`
already uses the correct lab protocol in `blmcp/tools_helpers/connection.py`, so no Claude-side
patch was needed.
