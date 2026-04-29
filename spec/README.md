# filepacks Specification

This directory is the public source of truth for the v0 `.fpk` artifact
format.

## Versioned Contracts

- [Filepack `.fpk` Specification](FILEPACK_SPEC.md)
- [Manifest v1 JSON Schema](schemas/manifest-v1.schema.json)

## Compatibility Rules

- A conforming producer MUST emit canonical artifacts exactly as specified.
- A conforming verifier MUST reject malformed archives and invalid manifests.
- The `.fpk` artifact byte stream is the v0 trust anchor.

The v0 OSS specification intentionally excludes registry protocols, typed eval
artifacts, cloud features, local store abstractions, and unstable aliases.
