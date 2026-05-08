# filepacks evaluation corpus

This directory stores real run evidence for measuring whether deterministic `.fpk` artifacts improve reviewability, reproducibility, and agent-to-agent reuse.

The corpus measures the evidence package around a run. It does not measure agent correctness, task success, product impact, or model quality by itself.

The evaluation unit is:

```text
task -> run -> artifact -> review
```

The corpus should use real engineering work only. Do not add synthetic benchmark prompts, opaque AI scores, private customer data, secrets, roadmap content, hosted-product implementation details, leaderboard language, or benchmark claims.

## Layout

```text
evals/
  candidates/
    repos.example.json
    issues.example.json
  methodology/
  runs/
    run-0001/
      run.json
      task.md
      artifact.fpk
      baseline.fpk
      review.json
      timing.json
      notes.md
  schemas/
  scripts/
  reports/
```

`baseline.fpk` is optional. All other files are expected for a completed run.

## External OSS methodology

The external OSS methodology prepares controlled runs using real public issues from external repositories and a non-Codex executor:

- `evals/methodology/external-oss-runs.md`
- `evals/methodology/repo-selection.md`
- `evals/methodology/issue-selection.md`
- `evals/methodology/executor-protocol-opencode-copilot.md`

Codex may maintain the methodology, candidate templates, and local preflight tooling. Codex should not execute the controlled external issue attempts. The intended executor for those future runs is GitHub Copilot accessed through OpenCode.

Candidate examples live in `evals/candidates/`. They are placeholders and should not be treated as selected repositories or issues.

Validate local candidate files without network access:

```bash
npm run evals:validate-candidates
```

## Create a run

Package the agent output first:

```bash
npx filepacks pack ./agent-output --output ./candidate.fpk
```

Then create a corpus entry:

```bash
npm run evals:create -- \
  --task-type bugfix \
  --repository filepacks-oss \
  --agent codex \
  --model gpt-5 \
  --task ./task.md \
  --artifact ./candidate.fpk \
  --expected-evidence agent-task-summary.md,changes.patch,test-output.txt,metadata.json
```

The script creates the next `run-NNNN` directory unless `--id` is provided.

## Aggregate results

```bash
npm run evals:aggregate
```

The aggregate script calls `measureRunEvidence()` from `@filepacks/core` for each run that has an `artifact.fpk`. That API is the source of truth for artifact evidence measurement:

- candidate artifact digest, file count, and byte count
- verification pass/fail, checked files, and mismatches
- expected evidence paths present or missing
- baseline comparison counts when `baseline.fpk` is present
- review duration, decision, confidence, and reusable-by-another-agent fields when provided

Runs with missing artifacts are kept in the report with a warning and no measurement object.

The script writes:

- `evals/reports/summary.json`
- `evals/reports/summary.md`

The generated summary also includes a current-state section that separates measured artifacts from completed runs, incomplete measured artifacts, infrastructure failures, invalid packaging attempts, no-repro/no-change artifacts, and held runs. These categories are descriptive. They are not benchmark scores.

As of Batch 003, the strongest supported finding is protocol-level: deterministic finalization improved valid artifact production compared with executor-created packaging. The corpus does not yet support claims about agent correctness, model quality, or workflow improvement.

## Review fields

Human review is required. Fill in `review.json` after review with observable facts such as decision, confidence, review timestamps or duration, missing context count, clarification request count, and whether another agent could reuse the artifact.

These fields map directly into `measureRunEvidence().review` when possible:

- `decision` -> `decision`
- `confidence` -> `confidence`
- `review_started_at` -> `startedAt`
- `review_ended_at` -> `endedAt`
- `reusable_by_another_agent` -> `reusableByAnotherAgent`

Use the data to compare workflows, not to claim an opaque benchmark score.
