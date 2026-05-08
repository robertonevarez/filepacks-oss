# Batch 003: Deterministic Finalization Preflight

Batch 003 prepares five controlled external OSS evaluation runs using the post-Batch-002 protocol. The executor is OpenCode with GitHub Copilot using `github-copilot/gpt-5-mini`. Issue fixes are not executed during this preparation pass.

Batch 003 changes the packaging boundary: the executor writes evidence files only, and the deterministic local finalization script creates and verifies `artifact.fpk` after the executor exits.

## Selected Runs

| Run | Candidate issue | Repository | Issue | Task type | Setup preflight |
| --- | --- | --- | --- | --- | --- |
| run-0011 | ljharb-qs-525 | ljharb/qs | https://github.com/ljharb/qs/issues/525 | bugfix | verified |
| run-0012 | ljharb-qs-516 | ljharb/qs | https://github.com/ljharb/qs/issues/516 | refactor | verified |
| run-0013 | ljharb-qs-526 | ljharb/qs | https://github.com/ljharb/qs/issues/526 | refactor | verified |
| run-0014 | yargs-yargs-2481 | yargs/yargs | https://github.com/yargs/yargs/issues/2481 | bugfix | partial |
| run-0015 | yargs-yargs-2472 | yargs/yargs | https://github.com/yargs/yargs/issues/2472 | bugfix | partial |

## Execution Stack

- Tool: OpenCode
- Provider: GitHub Copilot
- Model: `github-copilot/gpt-5-mini`
- Fallback: none inside this batch unless the run is explicitly marked failed or incomplete before any issue work begins
- Retries: no retries inside the batch
- Packaging: executor must not create archives; humans run `npm run evals:finalize-run -- <run-id>` after each executor attempt

## Deterministic Finalization Gate

Before the executor exits, it must either write enough evidence under `evals/runs/<run-id>/evidence/` for the observed outcome, or mark `run.json` as `incomplete`, `failed`, or `rejected` and explain the missing evidence in `notes.md`.

Evidence expectations by outcome:

- Patch attempt: include `changes.patch`, command output, validation output, and review notes.
- No-repro/no-change: include `reproduction-notes.md` or `no-changes.md`, plus command output.
- Failed infrastructure run: include `failure-log.md` or equivalent notes.
- Incomplete run: include `incomplete-reason.md` or equivalent notes.

The executor must not create `artifact.fpk`, `artifact.tgz`, `zip`, `tar.gz`, or renamed archives.

After each executor attempt, the human runs:

```bash
npm run evals:finalize-run -- <run-id>
npm run evals:aggregate
```

## Preflight Notes

- `ljharb/qs` cloned, installed, and passed `npm test` locally at `a0a81ea2071acce3eff41a040f719ac8f5c4f64c`.
- `yargs/yargs` cloned, installed, compiled, and passed the main Mocha suite at `437f3a4e0f4166e1f1a3ce023b0331159582746d`. Full `npm test` reaches `npm run check`, which currently reports existing Prettier formatting errors in `lib/command.ts` and `lib/yargs-factory.ts`; yargs runs use the focused compile plus Mocha validation path and must preserve that blocker honestly.
- pipx package-cache issues were avoided for Batch 003.
- Go issues were avoided because Go was not part of the verified Batch 003 setup.
- No Batch 001 or Batch 002 outcomes were changed or backfilled.

## Parallel Policy

Batch 003 may be run with maximum concurrency 2 after preparation and preflight. Each run must use `evals/workspaces/<run-id>/`, write only to `evals/runs/<run-id>/`, avoid shared temporary output, and stop parallel execution if rate limits or permission errors appear.

No benchmark claims should be made from this batch. The corpus records run evidence, including failures and incomplete outcomes.
