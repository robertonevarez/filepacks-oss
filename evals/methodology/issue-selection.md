# Issue selection criteria

Candidate issues should be real public issues that can be attempted locally and reviewed from observable evidence.

## Prefer Issues That Are

- Real public issues from selected repositories.
- Clearly scoped.
- Reproducible locally, or have a documented reason reproduction is not possible.
- Verifiable through tests, build, lint, typecheck, docs validation, or focused manual checks.
- Likely to change 1-10 files.
- Suitable for review in minutes.
- Public-safe to package in `.fpk` artifacts.

## Avoid Issues That Are

- Vague or missing expected behavior.
- Huge architecture rewrites.
- Subjective-only UX debates.
- Security vulnerabilities or exploit details.
- Secret-dependent.
- Impossible to validate locally.
- Dependent on private accounts, paid services, or production data.

## Preflight Checklist

Record the result in `evals/candidates/issues.example.json` or a real local candidate file before selection:

- Issue URL, title, type, and repository ID are recorded.
- Expected starting commit is known.
- Reproduction command or reproduction notes are documented.
- Validation method is documented.
- Expected changed-file range is estimated.
- Public-safety concerns are checked.
- Complexity is small or medium.
- Status and rejection reason, if any, are recorded.

Do not implement the fix during issue preflight.
