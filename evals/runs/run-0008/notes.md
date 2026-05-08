# run-0008 notes

Prepared for Batch 002. Execution attempted through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Execution Attempt

- Command: `OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0008/executor-prompt.md)"`
- Result: incomplete, no artifact
- Workspace: `evals/workspaces/run-0008/pipx`
- Base commit: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`
- Reproduction result: not confirmed
- Source changes made: yes, in the external workspace only
- Changed files observed: `scripts/list_test_packages.py`, `tests/conftest.py`
- Validation: failed in pipx test session setup first because `pip` was not found, then because `.venv/bin/pypi-server` was missing.
- Artifact created: no
- Model switched: no

The wave process was stopped after no new output for several minutes. Preserve this as an incomplete run. Do not retry inside Batch 002.
