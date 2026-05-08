# run-0007 notes

Prepared for Batch 002. Execution attempted through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Execution Attempt

- Command: `OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0007/executor-prompt.md)"`
- Result: incomplete, invalid artifact packaging
- Workspace: `evals/workspaces/run-0007/pipx`
- Base commit: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`
- Reproduction result: partially attempted
- Source changes made: yes, in the external workspace only
- Changed file reported by executor: `scripts/list_test_packages.py`
- Validation reported by executor: targeted tests passed with `--net-pypiserver`
- Artifact created: `evals/runs/run-0007/artifact.fpk` exists but is a tar/gzip file, not a valid filepacks artifact
- Model switched: no

Preserve this as an incomplete run with invalid artifact packaging. Do not retry inside Batch 002 and do not backfill a corrected artifact.
