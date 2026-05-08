# run-0010 notes

Prepared for Batch 002. Execution attempted through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Execution Attempt

- Command: `OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0010/executor-prompt.md)"`
- Result: incomplete, no artifact
- Workspace: `evals/workspaces/run-0010/ky`
- Base commit: `61d6d66d27911001b9b4d57ab93139f9ad61384b`
- Reproduction result: not reproduced; focused 204 tests passed
- Source changes made: no
- Validation: `npm install --no-audit --no-fund`, `npm run build`, and `npx ava test/body-size.ts test/main.ts --match "*204*"` completed with 4 focused tests passing.
- Artifact created: no
- Model switched: no

The executor correctly avoided forcing a patch for the closed historical issue, but it did not create a no-repro `artifact.fpk`. Preserve this as incomplete and unmeasured. Do not backfill a corrected artifact.
