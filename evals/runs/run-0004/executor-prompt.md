# Controlled external OSS run: run-0004

Do not modify filepacks methodology, schemas, aggregation scripts, or measurement code. Do not claim benchmark results. Preserve failed and incomplete work.

## Model policy

- Tool: OpenCode.
- Provider: GitHub Copilot.
- Required model: GPT-5 mini.
- `run.json` currently has `model_identifier: null`; before execution, fill it with the exact identifier from `opencode models` or `opencode models github-copilot`.
- Fallback: GPT-4.1 only if GPT-5 mini is unavailable. If fallback is used, update `model` and `model_substitution_reason` before starting.
- Do not switch models mid-run.

## OpenCode command

Run this from the `filepacks-oss` repository root:

```bash
opencode run "$(cat evals/runs/run-0004/executor-prompt.md)"
```

## Issue

- Candidate issue id: `tj-commander-js-2439`
- Issue URL: https://github.com/tj/commander.js/issues/2439
- Repository: https://github.com/tj/commander.js
- Task type: bugfix

## Instructions

1. Clone the external repository into a clean working directory:
   ```bash
   git clone https://github.com/tj/commander.js
   cd commander.js
   ```
2. Checkout a clean base commit from the default branch. Record the branch and commit SHA in `repo-metadata.json`.
3. Run setup:
   ```bash
   npm install
   ```
4. Run baseline validation and capture output:
   ```bash
   env -u NO_COLOR npm test
   npm run check
   ```
5. Reproduce or characterize the default-value mismatch between main command and subcommands. Record commands and observed output in `reproduction-output.txt`.
6. Make the smallest reasonable fix with focused regression tests.
7. Run final validation:
   ```bash
   env -u NO_COLOR npm test
   npm run check
   ```
8. Capture commands and outputs in `commands-run.md`, `reproduction-output.txt`, and `validation-output.txt`.
9. Create `changes.patch`, `issue-metadata.json`, `repo-metadata.json`, `metadata.json`, and `agent-task-summary.md`.
10. Package the evidence with filepacks from the prepared evidence directory:
    ```bash
    npx filepacks pack ./agent-output --output ./artifact.fpk
    ```
11. Copy `artifact.fpk` into `evals/runs/run-0004/artifact.fpk` and complete `run.json`, `timing.json`, `review.json`, and `notes.md`.

Do not fabricate metadata. If the run fails, stalls, or is incomplete, preserve the evidence and mark the run accordingly.
