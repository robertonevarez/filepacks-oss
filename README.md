# Filepacks

Deterministic `.fpk` artifacts for portable file evidence.

Filepacks v0 is intentionally narrow. It defines a stable `.fpk` artifact
format and a small CLI/core surface for packaging files, inspecting manifests,
verifying payload integrity, and comparing two artifacts.

```txt
Input directory
        ↓
    Filepacks CLI
        ↓
      .fpk
        ↓
inspect / verify / compare
```

## v0 OSS Scope

Included in v0:

- `.fpk` artifact format and validation rules
- Core pack logic
- Core inspect logic
- Core verify logic
- Core compare logic
- Shared manifest, file, and diff types

Excluded in v0:

- Cloud features
- Remote registry, storage, or sync
- Local store abstractions unless they are part of the stable CLI core
- Unstable tagging or aliasing
- Auth, workspaces, or multi-user features
- Experimental or internal-only commands
- Internal fixtures, private eval data, or proprietary examples

## Initial CLI Surface

The initial public CLI command surface is frozen as:

```bash
filepacks pack <input> --output <file>
filepacks inspect <file>
filepacks verify <file>
filepacks compare <baseline> <candidate>
```

Commands such as `show`, `list`, `tag`, `unpack`, registry commands, import
adapters, baseline workflows, and other internal or experimental commands are
not part of the v0 OSS surface.

Deferred commands are quarantined outside this export. The v0 CLI package does
not bundle registry, local store, tag, alias, typed eval/import, history, event,
show, list, or unpack logic.

## What Filepacks Provides

- Deterministic `.fpk` artifacts for file evidence
- Manifest-first inspection without unpacking payload files
- Local verification of paths, sizes, hashes, and payload contents
- Structural comparison for two `.fpk` artifacts
- Shared manifest, file, and diff types for the core artifact path

## Non-Goals

filepacks v0 is not:

- An artifact registry
- A storage or sync service
- An MLOps platform
- A workflow engine
- A replacement for Git or dataset versioning
- A cloud platform

## Stability / v0 Contract

- The `.fpk` artifact format is intended to remain stable starting with v0.1.0.
- Backward compatibility for valid `.fpk` artifacts is a priority.
- CLI and programmatic APIs may change before v1.0.
- Determinism is a core guarantee: the same logical input should produce the
  same artifact bytes, subject to the documented spec.

## CLI

The `filepacks` CLI emits and verifies `.fpk` artifacts.

| Command area | Evidence-bundle role |
| --- | --- |
| `pack` | Capture a directory of files as a deterministic `.fpk` artifact. |
| `verify` | Validate artifact integrity before review or sharing. |
| `inspect` | Summarize an artifact for quick human review. |
| `compare` | Compare baseline and candidate artifacts to understand what changed. |

## Quickstart

From a checkout:

```bash
npm install
npm run build:core
npm run test:core
npm run test:cli
```

Create and verify a local artifact:

```bash
mkdir -p /tmp/filepacks-demo
printf 'hello\n' > /tmp/filepacks-demo/hello.txt

./packages/cli/bin/dev.js pack /tmp/filepacks-demo --output /tmp/demo.fpk
./packages/cli/bin/dev.js inspect /tmp/demo.fpk
./packages/cli/bin/dev.js verify /tmp/demo.fpk
./packages/cli/bin/dev.js compare /tmp/demo.fpk /tmp/demo.fpk
```

## Repository Layout

- `packages/core`: reusable `.fpk` artifact primitives and shared types.
- `packages/cli`: conservative v0 CLI wrapper for the stable core commands.
- `spec`: public `.fpk` artifact format documentation and validation rules.

## `.fpk` Format

A `.fpk` file is a POSIX tar archive with a deterministic structure:

```txt
manifest.json
payload/
  <files...>
```

`manifest.json` is the canonical metadata document. Payload files are stored
under `payload/` with normalized relative paths. Creation uses lexical
traversal, sorted manifest entries, and normalized tar headers so the same
input produces identical artifact bytes.

See the public format specification in `spec/`.
