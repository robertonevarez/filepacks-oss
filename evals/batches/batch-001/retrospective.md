# Batch 001 retrospective

Batch 001 was the first controlled external OSS evaluation batch executed through OpenCode with GitHub Copilot. It produced real measured corpus data and also exposed protocol failures that should remain visible.

No Batch 001 run should be retried, rewritten, or sanitized as part of this retrospective. Failed, incomplete, and missing-evidence outcomes are part of the evidence record.

## Aggregate result

- Planned runs: 5
- Measured artifacts: 2
- Preserved infra failures: 2
- Incomplete no-artifact runs: 1
- Verification pass rate for measured artifacts: 100% (2/2)
- Missing expected evidence paths: 1
- Benchmark claims: none

## Run outcomes

| Run | Outcome | Measured | Notes |
| --- | --- | --- | --- |
| `run-0001` | Completed no-repro artifact | yes | Artifact verified, but expected `changes.patch` was missing. This is useful evidence that `measureRunEvidence()` surfaces incomplete expected evidence even when an artifact verifies. |
| `run-0002` | Preserved infra failure | no | OpenCode hit an auto-rejected `/tmp/*` permission request before issue work. |
| `run-0003` | Completed patch artifact | yes | OpenCode reproduced the issue, made a minimal external-workspace patch, validated it, and packaged evidence. |
| `run-0004` | Preserved infra failure | no | OpenCode hit an auto-rejected `/private/tmp/*` permission request before install, reproduction, validation, or packaging. |
| `run-0005` | Incomplete after external fix attempt | no | OpenCode made progress through setup, reproduction, a small external-workspace test-support change, and validation, but exited without packaging `artifact.fpk`. |

## What worked

- The candidate and run metadata structure was enough to plan and execute real external OSS attempts.
- The OpenCode permission smoke test fixed the initial permission gate for later attempts.
- Aggregation correctly measured only runs with `artifact.fpk`.
- `measureRunEvidence()` exposed missing expected evidence without failing artifact verification.
- Failed and incomplete runs stayed in the corpus instead of being hidden.

## What failed

- Early prompts allowed OpenCode to choose temporary workspaces, which created permission failures before the issue attempts began.
- The permission configuration was not explicit enough until `OPENCODE_CONFIG="$PWD/opencode.json"` was used.
- The run prompts did not enforce a hard finalization gate. `run-0005` reached validation progress but exited without an artifact or a complete failed/incomplete metadata handoff.
- Expected evidence did not yet vary cleanly by outcome type, so `run-0001` expected `changes.patch` even though it was a no-repro/no-change run.

## Protocol changes for future batches

- Use `evals/workspaces/<run-id>/` as the executor workspace.
- Run OpenCode with `OPENCODE_CONFIG="$PWD/opencode.json"` when a project-local config is required.
- Require a finalization gate before executor exit:
  - `artifact.fpk` exists under `evals/runs/<run-id>/`, or
  - `run.json` explicitly marks `status` as `incomplete` or `failed`.
- If no artifact exists, `notes.md` must explain why.
- `review.json` must state whether review was possible.
- `timing.json` must be completed as best-effort, with nulls only where the schema allows unknown values.
- Expected evidence should match the outcome type:
  - Patch run: `changes.patch`.
  - No-repro/no-change run: `no-changes.md` or `reproduction-notes.md`.
  - Failed infra run: `failure-log.md` or `notes.md`.
  - Incomplete run: `incomplete-reason.md` or `notes.md`.

## Interpretation

Batch 001 should be read as a protocol shakedown plus initial evidence collection, not as a benchmark. The corpus measures run evidence completeness and artifact verifiability. It does not yet support claims about agent correctness, intelligence, or comparative performance.
