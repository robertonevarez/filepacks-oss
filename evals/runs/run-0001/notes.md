# run-0001 notes

Prepared for Batch 001. Execution completed through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Environment Preflight

- Checked at: 2026-05-08T00:00:00.000Z
- Clone status: passed
- Base ref: default-branch-depth-1
- Base commit: `61d6d66d27911001b9b4d57ab93139f9ad61384b`
- Install command: `npm install`
- Install status: passed
- Baseline command(s): `npm run build`, `npx ava test/body-size.ts test/main.ts --match "searchParams option merges with existing query when hash is present"`
- Baseline status: passed
- Issue-specific reproduction: partial
- Reproduction notes: Focused existing searchParams validation passed. The Node 18/19 URLSearchParams.size compatibility issue was not reproduced on this local runtime and remains for executor confirmation.
- External repo worktree clean after preflight: yes
- Blockers: none

## Execution Attempt

- Attempted at: 2026-05-08T00:00:00.000Z
- Command: `OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0001/executor-prompt.md)"`
- Tool/provider/model: OpenCode / GitHub Copilot / `github-copilot/gpt-5-mini`
- Result: completed with artifact
- Workspace: `evals/workspaces/run-0001/ky`
- Base ref: `main`
- Base commit: `61d6d66d27911001b9b4d57ab93139f9ad61384b`
- Install command: `npm install --no-audit --no-fund`
- Baseline/final validation: `npm run build`; `npx ava test/body-size.ts test/main.ts --match "searchParams option merges with existing query when hash is present"`
- Reproduction result: not reproduced in this environment; targeted test passed.
- Source changes made: no
- Artifact created: yes, `evals/runs/run-0001/artifact.fpk`
- Model switched: no

This is a completed evidence run, not a confirmed fix. The artifact preserves the non-reproduction and no-change outcome.
