# @filepacks/core

Reusable filepacks artifact primitives for packaging, inspection, verification, and structural comparison.

Use this package when you want the `.fpk` workflow inside a Node.js tool, harness, or automation layer without parsing CLI output.

## Install

```bash
npm install @filepacks/core
```

## Public surface

- `.fpk` artifact format and validation rules
- `pack()`
- `inspect()`
- `verify()`
- `compare()`
- shared manifest, file, and diff types

The `.fpk` artifact format is intended to remain stable starting with v0.1.0. Programmatic APIs may change before v1.0.

## Minimal example

```ts
import {pack, inspect, verify, compare} from '@filepacks/core'

await pack({input: '/tmp/input', output: '/tmp/example.fpk'})
const artifact = await inspect({artifact: '/tmp/example.fpk'})
const verification = await verify({artifact: '/tmp/example.fpk'})
const diff = await compare({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/example.fpk',
})
```

## What each function returns

- `pack()` returns the output path, manifest, input directory, and archive digest
- `inspect()` returns the manifest, payload file entries, and archive digest
- `verify()` returns `ok`, mismatch details, and checked file count
- `compare()` returns `ok`, summary counts, and added/removed/changed file details

## Common patterns

### Create an artifact with an explicit name

```ts
await pack({
  input: '/tmp/run-output',
  output: '/tmp/run-output.fpk',
  name: 'run-output',
})
```

### Verify before using an artifact as evidence

```ts
const result = await verify({artifact: '/tmp/run-output.fpk'})

if (!result.ok) {
  console.error(result.mismatches)
}
```

### Compare baseline vs candidate

```ts
const diff = await compare({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/candidate.fpk',
})

if (!diff.ok) {
  console.log(diff.summary)
}
```

## Out of scope

This package intentionally excludes CLI rendering, local artifact history, tags, baselines, hosted registry behavior, and product workflows.

See the repository docs for higher-level guidance:

- https://github.com/robertonevarez/filepacks-oss/tree/main/docs
