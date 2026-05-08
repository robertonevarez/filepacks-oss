# Batch 003 Executor Prompt: run-0013

You are executing one controlled external OSS evaluation run. Do not modify methodology, schemas, validation scripts, batch docs, or measurement code. Do not execute any other run.

## Model Policy

- Tool: OpenCode
- Provider: GitHub Copilot
- Required model: github-copilot/gpt-5-mini
- Do not switch models mid-run.
- If github-copilot/gpt-5-mini is unavailable, stop before issue work, mark this run incomplete or failed, and record the reason.

## Run Identity

- Run ID: run-0013
- Candidate issue ID: ljharb-qs-526
- Issue URL: https://github.com/ljharb/qs/issues/526
- Repository: ljharb/qs
- Base commit to start from: a0a81ea2071acce3eff41a040f719ac8f5c4f64c

## Workspace

Start from the filepacks-oss repository root and use this workspace only:

```bash
EVAL_ROOT="$(pwd)"
mkdir -p "$EVAL_ROOT/evals/workspaces/run-0013"
git clone https://github.com/ljharb/qs "$EVAL_ROOT/evals/workspaces/run-0013/qs"
cd "$EVAL_ROOT/evals/workspaces/run-0013/qs"
git checkout a0a81ea2071acce3eff41a040f719ac8f5c4f64c
```

Do not use a shared clone. Do not write issue-attempt output outside `$EVAL_ROOT/evals/runs/run-0013/` except for the external repo workspace above.

## Setup

Run:

```bash
npm install --no-audit --no-fund
```

Record the command and output in `$EVAL_ROOT/evals/runs/run-0013/evidence/commands-run.md` or a dedicated setup output file.

## Baseline Validation

Run before making changes:

```bash
npm test
```

Record output in `$EVAL_ROOT/evals/runs/run-0013/evidence/baseline-validation-output.txt`. If this command fails for pre-existing reasons, preserve the failure honestly. Do not hide it.

## Issue Reproduction

Attempt to reproduce the issue described at https://github.com/ljharb/qs/issues/526. Keep reproduction focused and local. Record reproduction commands and output in `$EVAL_ROOT/evals/runs/run-0013/evidence/reproduction-output.txt` and summarize in `$EVAL_ROOT/evals/runs/run-0013/evidence/reproduction-notes.md`.

Do not fabricate reproducibility. If reproduction is not confirmed, mark it unconfirmed and either preserve a no-repro/no-change run or continue only if the issue has a clearly documented validation path.

## Fix Attempt

If reproduction and scope are clear, make the smallest reviewable change that addresses the issue. Avoid broad refactors. Avoid unrelated formatting. Do not use filepacks-specific knowledge to bias the external repo fix.

After changes, capture:

```bash
git diff --binary > "$EVAL_ROOT/evals/runs/run-0013/evidence/changes.patch"
```

If no source changes are made, do not create an empty patch. Instead create `$EVAL_ROOT/evals/runs/run-0013/evidence/no-changes.md` explaining why.

## Final Validation

Run:

```bash
npm test
```

Record output in `$EVAL_ROOT/evals/runs/run-0013/evidence/validation-output.txt`. If validation cannot run, record why in `$EVAL_ROOT/evals/runs/run-0013/evidence/incomplete-reason.md` or `$EVAL_ROOT/evals/runs/run-0013/evidence/failure-log.md`.

## Evidence-Only Packaging Boundary

Do not create `artifact.fpk`.
Do not create `artifact.tgz`, `zip`, `tar.gz`, or renamed archives.
Write all evidence files into `$EVAL_ROOT/evals/runs/run-0013/evidence/` only.

After you exit, the human will run:

```bash
npm run evals:finalize-run -- run-0013
npm run evals:aggregate
```

## Metadata Completion

Before exit, update these files in `$EVAL_ROOT/evals/runs/run-0013/`:

- `run.json`: keep model fields unchanged; set status to `completed`, `incomplete`, `failed`, or `rejected` based on what happened.
- `notes.md`: summarize reproduction, changes or no-change reason, validation, and blockers.
- `timing.json`: fill start/end/duration as best effort.
- `review.json`: state whether review was possible and what evidence supports that.

Outcome-specific evidence requirements:

- Patch run: `changes.patch` is required.
- No-repro/no-change run: `no-changes.md` or `reproduction-notes.md` is required.
- Failed infrastructure run: `failure-log.md` or clear `notes.md` failure detail is required.
- Incomplete run: `incomplete-reason.md` or clear `notes.md` detail is required.

## Finalization Gate

Before exit, verify:

```bash
test -d "$EVAL_ROOT/evals/runs/run-0013/evidence"
test ! -f "$EVAL_ROOT/evals/runs/run-0013/artifact.fpk"
test ! -f "$EVAL_ROOT/evals/runs/run-0013/artifact.tgz"
find "$EVAL_ROOT/evals/runs/run-0013/evidence" -type f -print
```

If `evidence/` does not contain enough files for the observed outcome, either add the missing evidence files or mark the run `incomplete`/`failed` and explain why.

## Execution Command

The intended human command for this run is:

```bash
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0013/executor-prompt.md)"
```
