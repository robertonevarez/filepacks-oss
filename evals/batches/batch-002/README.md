# Batch 002 external OSS run preflight

Batch 002 prepares five controlled external OSS evaluation runs using the hardened post-Batch-001 protocol. These runs are prepared only; issue fixes have not been executed.

## Batch 001 carry-forward

Batch 001 remains preserved with two measured artifacts, two infra failures, and one incomplete no-artifact run. Batch 002 does not retry or alter those outcomes.

## Protocol rules

- Use `evals/workspaces/<run-id>/` for every external clone.
- Run OpenCode with `OPENCODE_CONFIG="$PWD/opencode.json"`.
- Keep GitHub Copilot pinned to `github-copilot/gpt-5-mini`.
- Do not switch models mid-run.
- Do not retry inside the batch.
- Preserve failed and incomplete runs exactly.
- Require the finalization gate before executor exit.
- Match expected evidence to the observed outcome type.

## Selected runs

| Run | Candidate issue | Repo | Issue state | Local preflight | Notes |
| --- | --- | --- | --- | --- | --- |
| `run-0006` | `pypa-pipx-1693` | `pypa/pipx` | open | verified | Open issue as of 2026-05-08. Clone and editable install verified in an isolated workspace; issue-specific PATH reproduction deferred to execution because it needs a small package fixture or integration scenario. |
| `run-0007` | `pypa-pipx-1681` | `pypa/pipx` | open | verified | Open issue as of 2026-05-08. Clone and editable install verified; executor should keep scope to local cache CLI behavior and tests. |
| `run-0008` | `pypa-pipx-1657` | `pypa/pipx` | open | verified | Open issue as of 2026-05-08. Clone and editable install verified; docs/manpage generation specifics are deferred to executor assessment. |
| `run-0009` | `go-task-task-2505` | `go-task/task` | open | blocked | Open issue as of 2026-05-08 and cloned successfully. Local install/build/test were not verified because Go is not installed on this machine; executor must treat this as a preflight blocker unless Go is available before execution. |
| `run-0010` | `sindresorhus-ky-732` | `sindresorhus/ky` | closed | verified | Issue is closed as of 2026-05-08. Current HEAD clone, npm install, build, and focused 204 tests passed. This is retained as a historical/no-repro candidate only; executor should preserve no-repro if current behavior is already fixed and must not force a patch. |

## Deferred or avoided candidates

- `sindresorhus-ky-784`: closed upstream; deferred rather than using a resolved timeout issue as a patch target.
- `tj-commander-js-2451`: closed upstream and depended on Node v25.2.0 behavior.
- `tj-commander-js-2436`: closed upstream and API intent remained subjective.
- Other `go-task/task` candidates: avoided because local Go tooling is unavailable and several deferred issues are now closed.
- `markdownlint/markdownlint` candidates: avoided because the local Ruby/Bundler environment is below the repository requirement noted during Batch 001 preflight.

## Parallel execution policy

Batch 002 may be executed in parallel after all run folders are prepared and preflighted.

- Maximum concurrency: 2 runs at a time.
- Each run must use its own workspace: `evals/workspaces/<run-id>/`.
- Each run must write only to its own `evals/runs/<run-id>/` folder.
- No shared temp output files.
- No shared external repo clone.
- No retries inside the batch.
- If OpenCode/Copilot rate limits or permission errors appear, stop parallel execution and continue serially.
- Run aggregation only after each individual run finishes, then once again after the full batch.
- Preserve failed/incomplete runs exactly.
- Do not merge partial metadata between runs.

## Execution command pattern

```bash
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/<run-id>/executor-prompt.md)"
```
