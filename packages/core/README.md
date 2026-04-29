# @filepacks/core

Reusable filepacks artifact primitives for packaging, inspection,
verification, and structural comparison.

This package intentionally excludes CLI rendering, local artifact history,
tags, baselines, hosted registry behavior, and product workflows. It is the
library surface other SDKs and tools should use before reaching for the CLI.

## v0 Surface

- `.fpk` artifact format and validation rules
- Core pack helpers
- Core inspect/read helpers
- Core verify helpers
- Core compare helpers
- Shared manifest, file, and diff types

The `.fpk` artifact format is intended to remain stable starting with v0.1.0.
Programmatic APIs may change before v1.0.

## Build

```sh
npm run build -w @filepacks/core
```
