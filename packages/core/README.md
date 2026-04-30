# @filepacks/core

Reusable filepacks artifact primitives for packaging, inspection,
verification, and structural comparison.

This package intentionally excludes CLI rendering, local artifact history,
tags, baselines, hosted registry behavior, and product workflows. It is the
library surface other SDKs and tools should use before reaching for the CLI.

## v0 Surface

- `.fpk` artifact format and validation rules
- `pack()`
- `inspect()`
- `verify()`
- `compare()`
- Shared manifest, file, and diff types

The `.fpk` artifact format is intended to remain stable starting with v0.1.0.
Programmatic APIs may change before v1.0.

## Programmatic Usage

```ts
import {pack, inspect, verify, compare} from '@filepacks/core'

await pack({input: '/tmp/input', output: '/tmp/example.fpk'})
const summary = await inspect({artifact: '/tmp/example.fpk'})
const verification = await verify({artifact: '/tmp/example.fpk'})
const diff = await compare({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/example.fpk',
})
```

Install from npm:

```bash
npm install @filepacks/core
```

## Build

```sh
npm run build -w @filepacks/core
```
