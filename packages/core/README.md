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
- `measureRunEvidence()`
- shared manifest, file, and diff types

The `.fpk` artifact format is intended to remain stable starting with v0.1.0. Programmatic APIs may change before v1.0.

## Minimal example

```ts
import {pack, inspect, verify, compare, measureRunEvidence} from '@filepacks/core'

await pack({input: '/tmp/input', output: '/tmp/example.fpk'})
const artifact = await inspect({artifact: '/tmp/example.fpk'})
const verification = await verify({artifact: '/tmp/example.fpk'})
const diff = await compare({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/example.fpk',
})
const measurement = await measureRunEvidence({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/example.fpk',
})
```

## What each function returns

- `pack()` returns the output path, manifest, input directory, and archive digest
- `inspect()` returns the manifest, payload file entries, and archive digest
- `verify()` returns `ok`, mismatch details, and checked file count
- `compare()` returns `ok`, summary counts, and added/removed/changed file details
- `measureRunEvidence()` returns JSON-serializable evidence-package measurement data composed from verification, optional comparison, expected evidence paths, and optional reviewer metadata

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

### Measure run evidence in a harness

```ts
const measurement = await measureRunEvidence({
  baseline: '/tmp/baseline.fpk',
  candidate: '/tmp/candidate.fpk',
  expectedEvidencePaths: ['agent-task-summary.md', 'test-output.txt'],
  review: {
    startedAt: '2026-05-08T12:00:00.000Z',
    endedAt: '2026-05-08T12:05:30.000Z',
    decision: 'approved',
    confidence: 'medium',
    reusableByAnotherAgent: true,
  },
})

console.log(measurement.verification.ok)
console.log(measurement.comparison?.totalChangedFiles)
console.log(measurement.evidence.missingCount)
console.log(measurement.review?.durationMs)
```

## Out of scope

This package intentionally excludes CLI rendering, local artifact history, tags, baselines, hosted registry behavior, and product workflows.

See the repository docs for higher-level guidance:

- https://github.com/robertonevarez/filepacks-oss/tree/main/docs
