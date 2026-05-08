# Controlled external OSS run: run-0010

You are executing a controlled external OSS evaluation run.

Executor:
- Tool: OpenCode
- Provider: GitHub Copilot
- Model: GPT-5 mini
- Model identifier: `github-copilot/gpt-5-mini`
- Do not switch models mid-run.

Run command:

```bash
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0010/executor-prompt.md)"
```

## Boundaries

- Do not modify filepacks methodology, schemas, measurement code, aggregation scripts, or candidate selection docs.
- Do not fabricate results, timing, review metadata, validation output, or benchmark claims.
- Preserve failures and incomplete work.
- Use `evals/workspaces/run-0010/` for the external repository workspace.
- Keep cloned repositories, dependencies, caches, and temporary workspaces out of git.
- Write run metadata only under `evals/runs/run-0010/`.

## Task

- Selected issue id: `sindresorhus-ky-732`
- Issue URL: https://github.com/sindresorhus/ky/issues/732
- External repository: https://github.com/sindresorhus/ky
- Workspace: `evals/workspaces/run-0010/ky`
- Clean base commit to record: `61d6d66d27911001b9b4d57ab93139f9ad61384b`
- Setup command: `npm install --no-audit --no-fund`
- Baseline validation command: `npm run build && npx ava test/body-size.ts test/main.ts --match "*204*"`
- Final validation command: `npm run build && npx ava test/body-size.ts test/main.ts --match "*204*"`

## Required steps

1. Clone the external repository into `evals/workspaces/run-0010/` if it is not already present.
2. Checkout the clean selected base commit: `61d6d66d27911001b9b4d57ab93139f9ad61384b`.
3. Record repo metadata and issue metadata.
4. Run setup.
5. Run baseline validation.
6. Attempt issue reproduction where possible.
7. Make the smallest reasonable fix only if the issue is reproduced or the task is otherwise clearly actionable.
8. Capture commands, output, validation evidence, and notes.
9. Package public-safe evidence into `artifact.fpk` when possible.
10. Complete run metadata files.

## Preflight notes

Issue is closed as of 2026-05-08. Current HEAD clone, npm install, build, and focused 204 tests passed. This is retained as a historical/no-repro candidate only; executor should preserve no-repro if current behavior is already fixed and must not force a patch.

## Outcome-specific evidence

- Patch run: include `changes.patch`.
- No-repro/no-change run: include `no-changes.md` or `reproduction-notes.md`.
- Failed infra run: include `failure-log.md` or detailed `notes.md`.
- Incomplete run: include `incomplete-reason.md` or detailed `notes.md`.

## Finalization gate

Before exiting, one of these must be true:

- `evals/runs/run-0010/artifact.fpk` exists and `run.json` records an artifact-producing outcome.
- No artifact exists, and `run.json` explicitly marks `status` as `incomplete`, `failed`, or `rejected`.

If no artifact exists:

- `notes.md` must explain why.
- `review.json` must state whether review was possible.
- `timing.json` must be completed as best-effort.
- Do not silently stop after validation progress.

Final self-check:

```bash
test -f evals/runs/run-0010/artifact.fpk || grep -E '"status": "(incomplete|failed|rejected)"' evals/runs/run-0010/run.json
```
