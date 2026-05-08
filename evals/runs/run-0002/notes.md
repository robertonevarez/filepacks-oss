# run-0002 notes

Prepared for Batch 001. Execution attempted through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Environment Preflight

- Checked at: 2026-05-08T00:00:00.000Z
- Clone status: passed
- Base ref: default-branch-depth-1
- Base commit: `61d6d66d27911001b9b4d57ab93139f9ad61384b`
- Install command: `npm install`
- Install status: passed
- Baseline command(s): `npm run build`
- Baseline status: passed
- Issue-specific reproduction: deferred
- Reproduction notes: Documentation gap was not verified in this environment preflight. Executor should inspect current docs and issue context before editing.
- External repo worktree clean after preflight: yes
- Blockers: none

No issue fix was attempted and no artifact was created.

## Execution Attempt

- Attempted at: 2026-05-08T00:00:00.000Z
- Command: `opencode run "$(cat evals/runs/run-0002/executor-prompt.md)"`
- Tool/provider/model: OpenCode / GitHub Copilot / `github-copilot/gpt-5-mini`
- Result: failed
- Failure stage: executor workspace setup
- OpenCode verified the model list and confirmed `github-copilot/gpt-5-mini` was available.
- OpenCode then hit an auto-rejected permission request for `/tmp/*` before creating `evals/workspaces/run-0002`, cloning the external repo, installing dependencies, checking reproduction, editing docs, validating, or packaging.
- Artifact created: no
- Issue fix attempted: no
- Model switched: no

The failure is preserved as the run outcome. Do not retry this run with a different model.
