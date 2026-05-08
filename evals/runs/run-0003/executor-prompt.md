# Controlled external OSS run: run-0003

Do not modify filepacks methodology, schemas, aggregation scripts, or measurement code. Do not claim benchmark results. Preserve failed and incomplete work.

## Model policy

- Tool: OpenCode.
- Provider: GitHub Copilot.
- Required model: GPT-5 mini.
- Project-local `opencode.json` pins `model` and `small_model` to `github-copilot/gpt-5-mini`.
- Before execution, confirm `run.json` has `model_identifier: "github-copilot/gpt-5-mini"`.
- Fallback: GPT-4.1 only if GPT-5 mini is unavailable. If fallback is used, update `model` and `model_substitution_reason` before starting.
- Do not switch models mid-run.

## Permission policy

Project-local `opencode.json` uses `permission: "allow"` for this controlled local evaluation batch. This is intentional to avoid permission gating skewing run results. Use `evals/workspaces/run-0003/` as the primary workspace, keep generated workspaces out of git, and preserve permission or workspace failures if they still occur.

## OpenCode command

Run this from the `filepacks-oss` repository root:

```bash
opencode run "$(cat evals/runs/run-0003/executor-prompt.md)"
```

## Issue

- Candidate issue id: `tj-commander-js-2445`
- Issue URL: https://github.com/tj/commander.js/issues/2445
- Repository: https://github.com/tj/commander.js
- Task type: refactor

## Instructions

1. Clone the external repository into the approved local workspace. Do not use `/private/tmp`.
   ```bash
   mkdir -p evals/workspaces/run-0003
   git clone https://github.com/tj/commander.js evals/workspaces/run-0003/commander.js
   cd evals/workspaces/run-0003/commander.js
   ```
   `evals/workspaces/` is gitignored. Do not commit cloned external repositories, dependencies, caches, or temporary output.
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
5. Reproduce or characterize the requested `addOption` API behavior with a focused test or local snippet. Record findings in `reproduction-output.txt`.
6. Make the smallest reasonable implementation and test change. Do not redesign the option API beyond the issue scope.
7. Run final validation:
   ```bash
   env -u NO_COLOR npm test
   npm run check
   ```
8. Capture commands and outputs in `commands-run.md`, `reproduction-output.txt`, and `validation-output.txt`.
9. Create `issue-metadata.json`, `repo-metadata.json`, `metadata.json`, and `agent-task-summary.md`. If files changed, include `changes.patch`. If no code or docs changes are made because the issue cannot be reproduced or no fix is justified, include `no-changes.md` explaining the no-change outcome.
10. Package the evidence with filepacks from the prepared evidence directory:
    ```bash
    npx filepacks pack ./agent-output --output ./artifact.fpk
    ```
11. Copy `artifact.fpk` into `evals/runs/run-0003/artifact.fpk` and complete `run.json`, `timing.json`, `review.json`, and `notes.md`.

Do not fabricate metadata. If the run fails, stalls, or is incomplete, preserve the evidence and mark the run accordingly. Permission or workspace failures are valid preserved failures.
