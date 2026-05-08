# Batch 002 retrospective

Batch 002 tested the hardened post-Batch-001 protocol with parallel execution. It produced no new measured artifacts, but it surfaced a more specific protocol flaw: artifact packaging should not be delegated to the executor agent.

No Batch 002 run should be retried, rewritten, or sanitized as part of this retrospective. Missing, invalid, and incomplete artifacts are part of the evidence record.

## Aggregate result

- Planned runs: 5
- Executed runs: 4
- Held runs: 1
- Measured artifacts added: 0
- Batch 002 incomplete runs: 4
- Batch 002 not executed: 1
- Benchmark claims: none

## Run outcomes

| Run | Outcome | Measured | Notes |
| --- | --- | --- | --- |
| `run-0006` | Incomplete | no | Executor created `artifact.tgz` instead of `artifact.fpk` after pipx package-cache validation failed. |
| `run-0007` | Incomplete | no | Executor wrote a tar/gzip file named `artifact.fpk`, which is not a valid filepacks artifact. |
| `run-0008` | Incomplete | no | Executor hit pipx test fixture failures, modified external test-support files, then stalled without an artifact. |
| `run-0009` | Not executed | no | Held because Go is not installed locally. |
| `run-0010` | Incomplete no-repro | no | Executor correctly avoided forcing a patch for a closed historical issue, but did not produce a no-repro artifact. |

## What worked

- Parallel execution kept run folders isolated.
- The no-repro boundary for `run-0010` was respected: no patch was forced.
- Aggregation did not count missing or invalid artifacts as measured.
- Filepacks surfaced packaging failures instead of hiding them behind success labels.

## What failed

- The executor still treated artifact packaging as an agent task.
- One run produced `artifact.tgz`; another produced a tar/gzip file named `artifact.fpk`.
- Executor-written metadata sometimes became schema-incompatible and required repair to preserve the outcome.
- Repeated pipx runs hit the same local test-fixture dependencies, showing that repo-specific setup blockers should be handled before parallel waves.

## Protocol change

Future batches should remove artifact packaging responsibility from OpenCode/Copilot:

- Executor writes evidence files only to `evals/runs/<run-id>/evidence/`.
- Executor must not create, tar, gzip, zip, or rename `artifact.fpk`.
- After the executor exits, a human runs:

```bash
npm run evals:finalize-run -- <run-id>
```

The deterministic finalization script creates `artifact.fpk` with filepacks, verifies it, and writes `finalization.json`.

## Interpretation

Batch 002 is a protocol-hardening batch, not a benchmark. It provides evidence that packaging and measurement should be deterministic local responsibilities, while the executor should focus on issue reproduction, attempted fix, validation, and public-safe evidence capture.
