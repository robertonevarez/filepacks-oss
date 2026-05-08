# Batch 001 external OSS run preflight

Batch 001 prepares five controlled external OSS evaluation runs. Codex prepared this batch but must not execute the issue fixes.

After execution, see [retrospective.md](retrospective.md) for the preserved Batch 001 outcomes and protocol hardening notes.

## Model preflight

The human/executor must verify OpenCode and GitHub Copilot before running any prompt.

1. Connect OpenCode to GitHub Copilot if needed:
   - Start OpenCode interactively.
   - Run `/connect`.
   - Select GitHub Copilot.
   - Complete GitHub device login.
2. Verify available models:
   - Run `opencode models`.
   - Or, if supported locally, run `opencode models github-copilot`.
   - Confirm the exact provider/model identifier for GPT-5 mini.
   - Fill `model_identifier` in each run's `run.json` before execution.
   - If GPT-5 mini is unavailable, record GPT-4.1 as the fallback in `model` and set `model_substitution_reason`.
3. Optional non-interactive smoke test:
   - Run `opencode run "Summarize this repository in five bullets."`.
   - Confirm the command exits successfully.

If model selection can be pinned through local OpenCode configuration, set GitHub Copilot GPT-5 mini there before running the batch. The exact local model identifier is intentionally left null until `opencode models` verifies it.

## Model policy

- Tool: OpenCode.
- Provider: GitHub Copilot.
- Model: GPT-5 mini for all Batch 001 runs.
- Fallback: GPT-4.1 only if GPT-5 mini is unavailable.
- Do not switch models mid-run.
- Use the same model across all Batch 001 runs.

## OpenCode Permission Policy

This repository includes a project-local `opencode.json` for Batch 001 execution. It intentionally grants permissive local execution access with `permission: "allow"` so OpenCode permission gating does not skew controlled run outcomes.

This setting is broad. Use it only for the controlled local evaluation workspace. The executor must still:

- Use `evals/workspaces/<run-id>/` as the primary external repository workspace.
- Keep cloned external repositories, dependencies, caches, and temporary workspaces out of git.
- Commit only run metadata, prompts, notes, reviews, timing files, and final `.fpk` artifacts under `evals/runs/`.
- Avoid editing methodology, schemas, aggregation scripts, or measurement code during issue attempts.
- Preserve permission or workspace failures as valid run failures if they still occur.

The project-local config pins:

```json
{
  "model": "github-copilot/gpt-5-mini",
  "small_model": "github-copilot/gpt-5-mini",
  "permission": "allow"
}
```

## Permission Smoke Test

Before running the remaining Batch 001 attempts, the human executor may run this smoke test from the `filepacks-oss` repository root. If the shell prompt shows the parent workspace, such as `filepacks %`, first change into `filepacks-oss`.

```bash
cd /Users/robertonevarez/projects/filepacks/filepacks-oss
test -f opencode.json
OPENCODE_CONFIG="$PWD/opencode.json" opencode run "Create evals/workspaces/permission-smoke-test/ok.txt with the text ok, then read it back. Also create and read a temporary file under /tmp/opencode-permission-smoke-test.txt."
```

After the smoke test, remove:

```bash
cd /Users/robertonevarez/projects/filepacks/filepacks-oss
rm -rf evals/workspaces/permission-smoke-test/
rm -f /tmp/opencode-permission-smoke-test.txt
```

Do not commit the smoke-test files.

## Fairness rules

- Do not substitute issues without recording why.
- Preserve failed, incomplete, and rejected runs.
- Permission and workspace failures are valid preserved failures.
- Do not let the executor modify methodology, schemas, aggregation scripts, or measurement code.
- Do not claim benchmark results.
- The corpus measures run evidence, not agent correctness or intelligence.

## Workspace Policy

Clone external repositories into `evals/workspaces/<run-id>/`. The `evals/workspaces/` directory is gitignored and must remain local-only.

Do not use `/private/tmp` for controlled executor runs. The run-0004 shakedown showed that temporary paths can trigger permission failures before the executor reaches install, reproduction, validation, or packaging.

Keep cloned external repositories, dependency folders, caches, and temporary output out of git. Commit only the run metadata, prompts, notes, reviews, timing files, and final `.fpk` artifacts under `evals/runs/`.

## Outcome Evidence

For runs that change files, include `changes.patch` in the artifact. For no-change or no-reproduction runs, include `no-changes.md` instead and record why no patch exists.

Expected evidence should match the outcome type. Do not retrofit earlier artifacts to hide missing evidence; missing expected evidence is a valid measurement signal.

## Run mapping

| Run | Candidate issue | External repo |
| --- | --- | --- |
| `run-0001` | `sindresorhus-ky-785` | `https://github.com/sindresorhus/ky` |
| `run-0002` | `sindresorhus-ky-633` | `https://github.com/sindresorhus/ky` |
| `run-0003` | `tj-commander-js-2445` | `https://github.com/tj/commander.js` |
| `run-0004` | `tj-commander-js-2439` | `https://github.com/tj/commander.js` |
| `run-0005` | `pypa-pipx-1696` | `https://github.com/pypa/pipx` |

## Execution command pattern

Run each prompt from the `filepacks-oss` repository root:

```bash
opencode run "$(cat evals/runs/<run-id>/executor-prompt.md)"
```

The concrete command is recorded in each run's `run.json` and repeated in each `executor-prompt.md`.
