# Controlled external OSS run: run-0001

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

Project-local `opencode.json` uses `permission: "allow"` for this controlled local evaluation batch. This is intentional to avoid permission gating skewing run results. Use `evals/workspaces/run-0001/` as the primary workspace, keep generated workspaces out of git, and preserve permission or workspace failures if they still occur.

## OpenCode command

Run this from the `filepacks-oss` repository root:

```bash
opencode run "$(cat evals/runs/run-0001/executor-prompt.md)"
```

## Issue

- Candidate issue id: `sindresorhus-ky-785`
- Issue URL: https://github.com/sindresorhus/ky/issues/785
- Repository: https://github.com/sindresorhus/ky
- Task type: bugfix

## Instructions

1. Clone the external repository into the approved local workspace. Do not use `/private/tmp`.
   ```bash
   mkdir -p evals/workspaces/run-0001
   git clone https://github.com/sindresorhus/ky evals/workspaces/run-0001/ky
   cd evals/workspaces/run-0001/ky
   ```
   `evals/workspaces/` is gitignored. Do not commit cloned external repositories, dependencies, caches, or temporary output.
2. Checkout a clean base commit from the default branch. Record the branch and commit SHA in `repo-metadata.json`.
3. Run setup:
   ```bash
   npm install
   ```
4. Run baseline validation and capture output:
   ```bash
   npm run build
   npx ava test/body-size.ts test/main.ts --match "searchParams option merges with existing query when hash is present"
   ```
5. Attempt to reproduce the issue from the public issue description. If reproduction cannot be confirmed, record that clearly in `reproduction-output.txt` and continue only if a small, testable fix remains justified.
6. Make the smallest reasonable fix. Prefer focused tests and minimal code changes.
7. Run final validation:
   ```bash
   npm run build
   npx ava test/body-size.ts test/main.ts --match "searchParams option merges with existing query when hash is present"
   ```
8. Capture commands and outputs in `commands-run.md`, `reproduction-output.txt`, and `validation-output.txt`.
9. Create `changes.patch`, `issue-metadata.json`, `repo-metadata.json`, `metadata.json`, and `agent-task-summary.md`.
10. Package the evidence with filepacks from the prepared evidence directory:
    ```bash
    npx filepacks pack ./agent-output --output ./artifact.fpk
    ```
11. Copy `artifact.fpk` into `evals/runs/run-0001/artifact.fpk` and complete `run.json`, `timing.json`, `review.json`, and `notes.md`.

Do not fabricate metadata. If the run fails, stalls, or is incomplete, preserve the evidence and mark the run accordingly. Permission or workspace failures are valid preserved failures.
