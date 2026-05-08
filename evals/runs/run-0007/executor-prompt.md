# Controlled external OSS run: run-0007

You are executing a controlled external OSS evaluation run.

Executor:
- Tool: OpenCode
- Provider: GitHub Copilot
- Model: GPT-5 mini
- Model identifier: `github-copilot/gpt-5-mini`
- Do not switch models mid-run.

Run command:

```bash
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0007/executor-prompt.md)"
```

## Boundaries

- Do not modify filepacks methodology, schemas, measurement code, aggregation scripts, or candidate selection docs.
- Do not fabricate results, timing, review metadata, validation output, or benchmark claims.
- Preserve failures and incomplete work.
- Use `evals/workspaces/run-0007/` for the external repository workspace.
- Keep cloned repositories, dependencies, caches, and temporary workspaces out of git.
- Write run metadata only under `evals/runs/run-0007/`.

## Task

- Selected issue id: `pypa-pipx-1681`
- Issue URL: https://github.com/pypa/pipx/issues/1681
- External repository: https://github.com/pypa/pipx
- Workspace: `evals/workspaces/run-0007/pipx`
- Clean base commit to record: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`
- Setup command: `python3 -m venv .venv && .venv/bin/python -m pip install -e . && .venv/bin/python -m pip install pytest`
- Baseline validation command: `.venv/bin/pipx --version`
- Final validation command: `.venv/bin/python -m pytest tests/test_main.py tests/test_run.py -q`

## Required steps

1. Clone the external repository into `evals/workspaces/run-0007/` if it is not already present.
2. Checkout the clean selected base commit: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`.
3. Record repo metadata and issue metadata.
4. Run setup.
5. Run baseline validation.
6. Attempt issue reproduction where possible.
7. Make the smallest reasonable fix only if the issue is reproduced or the task is otherwise clearly actionable.
8. Capture commands, output, validation evidence, and notes.
9. Package public-safe evidence into `artifact.fpk` when possible.
10. Complete run metadata files.

## Preflight notes

Open issue as of 2026-05-08. Clone and editable install verified; executor should keep scope to local cache CLI behavior and tests.

## Outcome-specific evidence

- Patch run: include `changes.patch`.
- No-repro/no-change run: include `no-changes.md` or `reproduction-notes.md`.
- Failed infra run: include `failure-log.md` or detailed `notes.md`.
- Incomplete run: include `incomplete-reason.md` or detailed `notes.md`.

## Finalization gate

Before exiting, one of these must be true:

- `evals/runs/run-0007/artifact.fpk` exists and `run.json` records an artifact-producing outcome.
- No artifact exists, and `run.json` explicitly marks `status` as `incomplete`, `failed`, or `rejected`.

If no artifact exists:

- `notes.md` must explain why.
- `review.json` must state whether review was possible.
- `timing.json` must be completed as best-effort.
- Do not silently stop after validation progress.

Final self-check:

```bash
test -f evals/runs/run-0007/artifact.fpk || grep -E '"status": "(incomplete|failed|rejected)"' evals/runs/run-0007/run.json
```
