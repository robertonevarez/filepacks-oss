# Repository selection criteria

Candidate repositories must be public, cloneable, and safe to package in `.fpk` artifacts.

## Required Criteria

- Public source repository with a real issue tracker.
- Clear license.
- Active maintenance and recent commits.
- Local install, build, or test instructions.
- Tasks can be attempted without private credentials or paid cloud services.
- Moderate complexity suitable for small-to-medium changes.
- Public-safe code, logs, fixtures, and issue content.

## Preferred Categories

- Developer tooling.
- CLI tools.
- SDKs.
- TypeScript or JavaScript libraries.
- Python tools.
- Go tools.
- Documentation tooling.
- Lightweight infrastructure tools.

## Initial Exclusions

- Giant monorepos.
- Abandoned repositories.
- Security-sensitive repositories or tasks.
- Repositories whose normal workflow requires private credentials.
- Repositories that require paid cloud services for basic validation.
- Repositories with unclear licensing.
- Repositories where useful validation cannot be run locally.

## Preflight Checklist

Record the result in `evals/candidates/repos.example.json` or a real local candidate file before selection:

- License is present and understandable.
- Clone succeeds without authentication.
- Default branch and a clean candidate commit are identified.
- Setup command is documented and deterministic enough for local execution.
- At least one validation command is available.
- Recent issue activity exists.
- Expected task size is compatible with one controlled run.
- No private, hosted-only, or secret-dependent workflow is required.

Do not solve any candidate issue during repository preflight.
