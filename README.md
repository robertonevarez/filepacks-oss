# filepacks

Artifact infrastructure for agent workflows, eval snapshots, CI evidence, and repeatable file review.

filepacks turns a directory of generated files into a deterministic `.fpk` artifact that you can inspect, verify, compare, and hand off as durable evidence.

The public OSS surface is intentionally small:

```bash
filepacks pack <input> --output <file>
filepacks inspect <file>
filepacks verify <file>
filepacks compare <baseline> <candidate>
```

## Why it exists

Loose output directories are easy to create but awkward to trust. They have no stable identity, no canonical manifest, and no built-in verification step.

filepacks adds:

- **one portable file** instead of a loose directory tree
- **a canonical `manifest.json`** with file paths, sizes, and hashes
- **deterministic archive bytes** for the same logical input
- **local verification** before review or handoff
- **structural comparison** for baseline-versus-candidate workflows

## Good fit

filepacks works well when you want:

- agent run outputs captured as portable artifacts
- eval result snapshots compared across runs
- CI-generated reports preserved for human review
- prompt or model output directories compared structurally
- a deterministic artifact boundary that humans and automation can both use

## Not in the v0 OSS surface

This repository does **not** include:

- registries, remote storage, or sync
- tags, aliases, or baseline resolution
- typed eval artifacts
- hosted product behavior
- cloud dashboards or workflow orchestration

## Quickstart

Install the CLI:

```bash
npm install -g filepacks
```

Or run it without a global install:

```bash
npx filepacks --help
```

Core workflow:

```bash
filepacks pack ./run-output --output ./run.fpk
filepacks inspect ./run.fpk
filepacks verify ./run.fpk
filepacks compare ./baseline.fpk ./run.fpk
```

## Packages

| Package | Purpose |
| --- | --- |
| `filepacks` | CLI for packaging, inspection, verification, and comparison |
| `@filepacks/core` | Programmatic API for the same artifact operations |

## Docs map

- [Quickstart](docs/quickstart.mdx)
- [CLI workflows](docs/cli/workflows.mdx)
- [Use cases](docs/use-cases.mdx)
- [Agent workflows](docs/agent-workflows.mdx)
- [Artifact reference](docs/artifacts/index.mdx)
- [Specification](spec/FILEPACK_SPEC.md)

## Repository layout

- `docs/`: Mintlify docs site content and configuration
- `packages/core`: reusable artifact primitives and shared types
- `packages/cli`: conservative wrapper around the public CLI commands
- `spec`: public `.fpk` specification, schema, and example artifacts

## Stability

- The `.fpk` artifact format is intended to remain stable starting with v0.1.0.
- Backward compatibility for valid `.fpk` artifacts is a priority.
- CLI and programmatic APIs may evolve before v1.0.
- Determinism is a core guarantee: the same logical input should produce the same artifact bytes, subject to the published spec.
