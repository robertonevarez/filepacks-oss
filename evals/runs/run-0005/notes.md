# run-0005 notes

Prepared for Batch 001. Execution attempted through OpenCode.

Model identifier recorded for execution: `github-copilot/gpt-5-mini`. Do not switch models mid-run.

## Environment Preflight

- Checked at: 2026-05-08T00:00:00.000Z
- Clone status: passed
- Base ref: default-branch-depth-1
- Base commit: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`
- Install command: `python3 -m venv .venv && .venv/bin/python -m pip install -e . && .venv/bin/python -m pip install --group test`
- Install status: passed
- Baseline command(s): `PATH=.venv/bin:$PATH .venv/bin/python -m pytest tests/test_animate.py`
- Baseline status: passed
- Issue-specific reproduction: partial
- Reproduction notes: Focused test file passed once: 11 passed in 86.76s. Flakiness was not confirmed in a single preflight pass and remains for executor assessment.
- External repo worktree clean after preflight: yes
- Blockers: none

## Execution Attempt

- Attempted at: 2026-05-08T00:00:00.000Z
- Command: `OPENCODE_CONFIG="$PWD/opencode.json" opencode run "$(cat evals/runs/run-0005/executor-prompt.md)"`
- Tool/provider/model: OpenCode / GitHub Copilot / `github-copilot/gpt-5-mini`
- Result: incomplete, no artifact
- Workspace: `evals/workspaces/run-0005/pipx`
- Base ref: default branch
- Base commit: `ed4646f0bcc327a622d6a123640f4b07fa6afca6`
- Reproduction result: test setup failures were reproduced before the external-workspace change.
- Source changes made: yes, in the external workspace only.
- Changed files: `scripts/list_test_packages.py`
- Validation: after installing `pypiserver[cache,passlib]` in the local venv, `tests/test_animate.py` reported 11 passing tests.
- Artifact created: no
- Model switched: no

The executor exited before packaging `artifact.fpk` or completing the run metadata. Preserve this as an incomplete run rather than retrying or backfilling an artifact.
