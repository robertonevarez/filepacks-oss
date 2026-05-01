# Changelog

All notable changes to this project will be documented in this file.

## 0.1.2 - 2026-05-01

- Fixed public CLI install guidance to distinguish clean-shell `npx` usage from persistent global installs.
- Added command-specific help for `pack`, `inspect`, `verify`, and `compare`.
- Rejected `pack --output` paths that do not end in `.fpk`.
- Refreshed quickstart and demo docs around AI-assisted software work.

## 0.1.0 - 2026-04-30

- Introduced initial public npm package split:
  - `filepacks` (CLI)
  - `@filepacks/core` (programmatic API)
- Locked public core API to `pack`, `inspect`, `verify`, and `compare` with shared public types.
- Locked public CLI command surface to `pack`, `inspect`, `verify`, and `compare`.
- Added publish-safe package metadata and validated package tarball contents via local pack tests.

## Release Discipline

- Use semver for all releases.
- Keep `.fpk` format stability and deterministic behavior as primary compatibility constraints.
- Avoid broadening CLI/core surface without explicit versioned release notes.
