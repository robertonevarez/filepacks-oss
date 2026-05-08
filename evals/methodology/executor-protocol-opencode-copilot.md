# Executor protocol: OpenCode + GitHub Copilot

This protocol is for future controlled external OSS runs. Codex should not execute these runs.

## Executor Boundary

The executor is GitHub Copilot accessed through OpenCode. The executor attempts the selected public issue in the selected external repository. It should not modify filepacks measurement code, candidate schemas, aggregation scripts, or methodology docs as part of the issue attempt.

The executor should use the issue, repository, and local validation context provided in the task packet. It should avoid filepacks-specific knowledge while deciding how to fix the issue.

## Required Steps

1. Clone the selected external public repository.
2. Checkout the clean selected commit.
3. Record repository metadata: URL, default branch, checked-out commit, license, language, setup command, validation commands, and local environment notes.
4. Record issue metadata: URL, title, issue type, selected labels, expected behavior, and validation method.
5. Reproduce the issue where possible. Preserve command output and note unreproducible cases.
6. Attempt the fix using GitHub Copilot through OpenCode.
7. Capture commands run, test output, build output, lint output, docs validation, and focused manual validation.
8. Preserve failure states, rejected attempts, incomplete work, and blocked runs.
9. Write public-safe evidence files into `evals/runs/<run-id>/evidence/`.
10. Fill `run.json`, `task.md`, `timing.json`, `review.json`, and `notes.md`.
11. Do not fabricate timing, review, validation, or benchmark metadata.
12. Before exiting, pass the finalization gate below.

## Output Files

The run directory should contain the normal eval files:

- `run.json`
- `task.md`
- `review.json`
- `timing.json`
- `notes.md`
- `evidence/`

OpenCode/Copilot should not create `artifact.fpk` directly. The executor writes evidence into `evidence/`; a human runs deterministic finalization after the attempt:

```bash
npm run evals:finalize-run -- <run-id>
```

The finalization script creates and verifies `artifact.fpk` with the real filepacks implementation.

When available, `evidence/` should include public-safe files such as:

- `agent-task-summary.md`
- `issue-metadata.json`
- `repo-metadata.json`
- `commands-run.md`
- `reproduction-output.txt`
- `validation-output.txt`
- `changes.patch`
- `metadata.json`

Use `review.json` for human review after the artifact exists. If no review has happened yet, keep `decision` as `needs_review` and use nulls where the schema allows them.

## Outcome-Specific Evidence

Expected evidence should match what happened. Do not force a patch-shaped artifact for a no-change or failed-infra run.

| Outcome | Required evidence guidance |
| --- | --- |
| Patch run | Include `changes.patch`. |
| No-repro or no-change run | Include `no-changes.md` or `reproduction-notes.md` explaining why no patch exists. |
| Failed infra run | Include `failure-log.md` or make `notes.md` explicit about the infra blocker. |
| Incomplete run | Include `incomplete-reason.md` or make `notes.md` explicit about what stopped before completion. |

## Finalization Gate

The executor must not exit with an ambiguous run state. Before ending the run, exactly one of these must be true:

- `evals/runs/<run-id>/evidence/` contains the evidence needed for deterministic finalization.
- No complete evidence exists, and `run.json` explicitly marks `status` as `incomplete`, `failed`, or `rejected`.

If no complete evidence exists:

- `notes.md` must explain why no finalizable evidence exists.
- `review.json` must state whether review was possible. If review was not possible, keep `decision` as `needs_review` and explain the blocker in `notes`.
- `timing.json` must be completed as best-effort, using nulls only where the schema allows unknown values.
- Preserve logs or notes describing the blocker. Do not retry silently and do not replace the outcome with a cleaner story.

## Packaging Guidance

Package only public-safe work products. Do not include credentials, local tokens, private configuration, personal data, cache directories, dependency folders, or unrelated repository history.

Do not create `artifact.fpk` manually. Do not tar, gzip, zip, or rename archives to `.fpk`. Only `npm run evals:finalize-run -- <run-id>` should create `artifact.fpk` for future batches.

The evidence directory should preserve what happened, including partial or failed attempts. A failed run with clear evidence is more useful than a missing run.

## Future Prompt Template Requirements

Future batch executor prompts should include a final checklist with these items:

- Confirm the model was not switched mid-run.
- Confirm the external repository workspace path.
- Confirm the checked-out base commit.
- Confirm whether the issue was reproduced.
- Confirm whether source changes were made.
- Confirm evidence was written under `evals/runs/<run-id>/evidence/`.
- Confirm `artifact.fpk` was not created manually.
- If no finalizable evidence was created, update `run.json`, `notes.md`, `review.json`, and `timing.json` to preserve the failed or incomplete outcome before exiting.
