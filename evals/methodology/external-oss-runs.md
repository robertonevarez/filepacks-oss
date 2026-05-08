# External OSS controlled run methodology

This methodology prepares filepacks evaluation runs that use real issues from public open source repositories and a non-Codex executor. It is for collecting inspectable run evidence, not for making benchmark claims.

Codex may help scaffold the methodology, preflight candidate repositories and issues, and maintain local validation tools. Codex must not execute the controlled external issue attempts described here.

## Roles

- Methodology maintainer: prepares candidate tracking, selection criteria, run templates, and preflight checks.
- Executor: uses OpenCode with GitHub Copilot to attempt selected issues in external repositories.
- Reviewer: reviews the produced `.fpk` artifact and run metadata after the executor finishes.
- Aggregator: runs the existing eval aggregation after runs are packaged.

The executor should not design or modify the measurement system. The methodology maintainer should not selectively discard failed, incomplete, or rejected executor runs.

## Run Unit

Each controlled run should map to one public issue in one selected public repository:

```text
external repo + issue + clean commit -> executor attempt -> .fpk artifact -> review -> aggregate report
```

The corpus measures the evidence package around the run: artifact verification, expected evidence presence, optional baseline comparison, review duration, and reviewer reuse metadata. It does not measure agent correctness, model intelligence, product impact, or a benchmark score.

## Controlled Flow

1. Select a candidate repository using `repo-selection.md`.
2. Select a candidate issue using `issue-selection.md`.
3. Record candidate metadata in local candidate files.
4. Preflight setup, reproduction, and validation commands without solving the issue.
5. Freeze the selected repo commit for the later executor run.
6. Hand the task to the OpenCode + GitHub Copilot executor using `executor-protocol-opencode-copilot.md`.
7. Preserve the executor output whether it succeeds, fails, stalls, or is rejected.
8. Package the output into a `.fpk` artifact using filepacks.
9. Fill `run.json`, `task.md`, `timing.json`, `review.json`, and `notes.md`.
10. Run the existing eval aggregation.

## Fairness Rules

- Do not use Codex to perform the controlled external issue attempts.
- Do not cherry-pick only successful fixes.
- Keep failed, incomplete, rejected, and unreproducible runs in the corpus with explicit notes.
- Do not claim improvement or model superiority from small or incomplete samples.
- Do not include private data, secrets, customer information, or private roadmap material.
- Do not ask the executor to optimize for filepacks measurement fields while solving the issue.
- Do not fabricate review metadata, timing data, command output, or benchmark claims.

## Expected Evidence

Each packaged run should include enough public-safe evidence for another reviewer to inspect what happened:

- task summary and selected issue metadata
- clean starting commit
- commands attempted
- reproduction notes
- build, test, lint, or docs validation output
- patch or changed files
- executor notes, including blockers and failures
- packaging notes when the run is incomplete

The exact expected paths are recorded in `run.json` and measured by `measureRunEvidence()` during aggregation.

## Status Language

Use conservative status terms:

- `candidate`: worth evaluating, not yet accepted.
- `preflighted`: local checks were run without solving the issue.
- `selected`: ready for a future controlled executor run.
- `rejected`: not suitable for the corpus; preserve the reason.
- `completed`: executor produced an artifact and metadata.

Avoid score, leaderboard, and superiority language until a separate, statistically appropriate analysis exists.
