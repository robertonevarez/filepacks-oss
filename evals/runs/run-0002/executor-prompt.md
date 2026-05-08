# Controlled external OSS run: run-0002

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
opencode run "$(cat evals/runs/run-0002/executor-prompt.md)"
```

## Issue

- Candidate issue id: `sindresorhus-ky-633`
- Issue URL: https://github.com/sindresorhus/ky/issues/633
- Repository: https://github.com/sindresorhus/ky
- Task type: docs_update

## Instructions

1. Clone the external repository into the approved local workspace. Do not use `/private/tmp`.
   ```bash
   mkdir -p evals/workspaces/run-0002
   git clone https://github.com/sindresorhus/ky evals/workspaces/run-0002/ky
   cd evals/workspaces/run-0002/ky
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
   ```
5. Review the issue and current documentation. Record whether the requested documentation gap is still present in `reproduction-output.txt`.
6. Make the smallest reasonable documentation change. Do not broaden this into API behavior work.
7. Run final validation:
   ```bash
   npm run build
   ```
   Run `npm test` if practical in the local environment; if browser dependencies block full tests, record the blocker.
8. Capture commands and outputs in `commands-run.md`, `reproduction-output.txt`, and `validation-output.txt`.
9. Create `changes.patch`, `issue-metadata.json`, `repo-metadata.json`, `metadata.json`, and `agent-task-summary.md`.
10. Package the evidence with filepacks from the prepared evidence directory:
    ```bash
    npx filepacks pack ./agent-output --output ./artifact.fpk
    ```
11. Copy `artifact.fpk` into `evals/runs/run-0002/artifact.fpk` and complete `run.json`, `timing.json`, `review.json`, and `notes.md`.

Do not fabricate metadata. If the run fails, stalls, or is incomplete, preserve the evidence and mark the run accordingly. Permission or workspace failures are valid preserved failures.
