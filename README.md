# filepacks

Reviewable execution artifacts for AI-generated work, agent workflows, and repeatable evidence review.

filepacks captures agent-generated files into a deterministic `.fpk` artifact: a portable, inspectable, verifiable container with a stable identity that humans and future agents can both use.

The public OSS surface is intentionally small:

```bash
filepacks pack <input> --output <file>
filepacks inspect <file>
filepacks verify <file>
filepacks compare <baseline> <candidate>
```

## Why it exists

Agent runs leave behind scattered evidence: logs, files, test output, screenshots, summaries. Teams need a stable way to review, compare, and preserve what actually happened.

filepacks adds:

- **one portable file** instead of a loose directory tree
- **a canonical `manifest.json`** with file paths, sizes, and hashes
- **deterministic artifact bytes** for the same logical input
- **local verification** before review or handoff
- **structural comparison** for baseline-versus-candidate workflows

## Good fit

filepacks works well when you want:

- agent run outputs captured as portable, reviewable artifacts
- eval result snapshots compared across runs
- CI-generated reports preserved as evidence
- agent work compared structurally (baseline vs. latest)
- a deterministic artifact boundary that humans and automation can both use

## Not in the v0 OSS surface

This repository does **not** include:

- registries, remote storage, or sync
- tags, aliases, or baseline resolution
- typed eval artifacts
- hosted product behavior
- cloud dashboards or workflow orchestration

## Quickstart

Quick trial from a clean shell:

```bash
npx filepacks --help
```

Persistent CLI install:

```bash
npm install -g filepacks
filepacks --help
```

The quick trial uses `npx` so the workflow stays copy-pasteable without putting `filepacks` on your `PATH` first.

Core workflow:

```bash
npx filepacks pack ./run-output --output ./baseline.fpk
npx filepacks inspect ./baseline.fpk
npx filepacks verify ./baseline.fpk
npx filepacks compare ./baseline.fpk ./latest.fpk
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
- [Run evidence measurement](docs/run-evidence-measurement.mdx)
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
