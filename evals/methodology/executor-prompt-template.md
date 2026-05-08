# Executor prompt template

Use this template for future OpenCode + GitHub Copilot batches. Do not rewrite completed Batch 001 prompts unless preserving a correction in documentation requires it.

# Controlled external OSS run: <run-id>

You are executing a controlled external OSS evaluation run.

Executor:
- Tool: OpenCode
- Provider: GitHub Copilot
- Model: GPT-5 mini
- Model identifier: `<verified-provider-model-id>`
- Do not switch models mid-run.

Run command:

```bash
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/<run-id>/executor-prompt.md)"
```

## Boundaries

- Do not modify filepacks methodology, schemas, measurement code, aggregation scripts, or candidate selection docs.
- Do not fabricate results, timing, review metadata, validation output, or benchmark claims.
- Preserve failures and incomplete work.
- Use `evals/workspaces/<run-id>/` for the external repository workspace.
- Keep cloned repositories, dependencies, caches, and temporary workspaces out of git.
- Do not create `artifact.fpk` manually.
- Do not tar, gzip, zip, or rename archives to `.fpk`.

## Task

- Selected issue id: `<candidate-issue-id>`
- Issue URL: `<issue-url>`
- External repository: `<repo-url>`
- Workspace: `evals/workspaces/<run-id>/<repo-name>`
- Setup command: `<setup-command>`
- Baseline validation command: `<baseline-command>`
- Final validation command: `<final-validation-command>`

## Required steps

1. Clone the external repository into `evals/workspaces/<run-id>/`.
2. Checkout the clean selected base commit.
3. Record repo metadata and issue metadata.
4. Run setup.
5. Run baseline validation.
6. Attempt issue reproduction where possible.
7. Make the smallest reasonable fix only if the issue is reproduced or the task is otherwise clearly actionable.
8. Capture commands, output, validation evidence, and notes.
9. Write public-safe evidence files into `evals/runs/<run-id>/evidence/`.
10. Complete run metadata files.

## Outcome-specific evidence

- Patch run: include `evidence/changes.patch`.
- No-repro/no-change run: include `evidence/no-changes.md` or `evidence/reproduction-notes.md`.
- Failed infra run: include `evidence/failure-log.md` or detailed `notes.md`.
- Incomplete run: include `evidence/incomplete-reason.md` or detailed `notes.md`.

## Finalization gate

Before exiting, one of these must be true:

- `evals/runs/<run-id>/evidence/` contains finalizable evidence for the deterministic finalization script.
- No complete evidence exists, and `run.json` explicitly marks `status` as `incomplete`, `failed`, or `rejected`.

If no complete evidence exists:

- `notes.md` must explain why.
- `review.json` must state whether review was possible.
- `timing.json` must be completed as best-effort.
- Do not silently stop after validation progress.

After the executor exits, a human runs:

```bash
npm run evals:finalize-run -- <run-id>
```

Only the finalization script creates `artifact.fpk`.

Final self-check:

```bash
test -d evals/runs/<run-id>/evidence || grep -E '"status": "(incomplete|failed|rejected)"' evals/runs/<run-id>/run.json
test ! -f evals/runs/<run-id>/artifact.fpk
```
