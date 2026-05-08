# Batch 003 retrospective

Batch 003 was the first batch run with deterministic finalization as the packaging boundary. OpenCode with GitHub Copilot wrote evidence only, then `npm run evals:finalize-run -- <run-id>` created and verified each `artifact.fpk`.

No Batch 003 run should be retried, backfilled, or sanitized as part of this retrospective. Incomplete measured artifacts are part of the corpus record.

## Aggregate result

- Planned runs: 5
- Executed runs: 5
- Measured artifacts added: 5
- Completed measured artifacts: 3
- Incomplete measured artifacts: 2
- Verification pass rate for measured Batch 003 artifacts: 100% (5/5)
- Benchmark claims: none

## Run outcomes

| Run | Outcome | Measured | Notes |
| --- | --- | --- | --- |
| `run-0011` | Incomplete with artifact | yes | Executor produced patch evidence and validation output, but validation had lint failures and the metadata gate was not completed cleanly. Artifact verifies and remains preserved. |
| `run-0012` | Incomplete with artifact | yes | Executor reported a no-change result in `opencode.log`, but only placeholder evidence was present in `evidence/` when finalization ran. Artifact verifies and remains preserved as incomplete evidence. |
| `run-0013` | Completed no-change artifact | yes | Executor completed a performance investigation, captured benchmark/reproduction evidence, and made no source changes. Artifact verifies. |
| `run-0014` | Completed patch artifact | yes | Executor produced focused yargs reproduction evidence and a patch containing reproduction scripts. Artifact verifies. |
| `run-0015` | Completed patch artifact | yes | Executor reproduced a nested config strict-mode issue, produced a patch, and captured evidence. Artifact verifies. |

## What worked

- Deterministic finalization produced valid `.fpk` artifacts for all five Batch 003 runs.
- The executor no longer created tar/gzip archives or renamed archives as artifacts.
- Aggregation measured Batch 003 artifacts without hiding missing expected evidence.
- The evidence-only executor boundary made packaging failures less likely than in Batch 002.
- Incomplete outcomes remained visible even when an artifact verified.

## What still failed

- `run-0011` stopped with unresolved lint failures and incomplete metadata.
- `run-0012` showed a protocol gap: finalization accepted a placeholder-only evidence directory, producing a valid but substantively incomplete artifact.
- Some executor metadata edits overwrote required run fields and had to be corrected without changing artifact contents.
- Expected evidence is still too broad for outcome-specific interpretation, leading to high missing-evidence counts for valid no-change and incomplete artifacts.

## Protocol implications

Future batches should keep deterministic finalization, but harden the pre-finalization checks:

- `evals:finalize-run` should reject placeholder-only evidence unless explicitly forced.
- Executor prompts should forbid replacing required `run.json` fields.
- Outcome-specific evidence expectations should be encoded before aggregation, not interpreted only in prose.
- Completed status should require both an artifact and a clean metadata/evidence gate; otherwise use `incomplete`.

## Current interpretation

Batch 003 does not support claims about agent quality, fix correctness, or benchmark improvement. The strongest current finding is protocol-level: deterministic finalization improved valid artifact production compared with executor-created packaging, while still surfacing incomplete evidence and metadata failures.
