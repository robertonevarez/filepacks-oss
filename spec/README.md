# filepacks Specification

This directory is the public source of truth for the v0 `.fpk` artifact contract.

Use it when you need the exact format rules behind the CLI and core package.

## Start here

- [filepack `.fpk` Specification](FILEPACK_SPEC.md): the canonical format, hashing, and determinism rules
- [Manifest v1 JSON Schema](schemas/manifest-v1.schema.json): machine-readable schema for generic manifests
- `examples/`: minimal public example artifacts used by the test suite

## What the spec covers

- archive layout
- tar header canonicalization
- normalized payload paths
- manifest fields and validation
- hashing rules
- determinism guarantees

## Compatibility rules

- A conforming producer MUST emit canonical artifacts exactly as specified.
- A conforming verifier MUST reject malformed archives and invalid manifests.
- The `.fpk` artifact byte stream is the v0 trust anchor.

## Out of scope

The public OSS specification intentionally excludes:

- registry protocols
- typed eval artifacts
- cloud features
- local store abstractions
- unstable aliases
