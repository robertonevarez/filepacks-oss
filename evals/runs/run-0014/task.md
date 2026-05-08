# run-0014: yargs-yargs-2481

Repository: yargs/yargs
Issue: https://github.com/yargs/yargs/issues/2481
Title: unknown command giving the wrong error message with .strict() and .strictCommands()? 
Task type: bugfix

## Objective

Attempt the issue with OpenCode + GitHub Copilot using `github-copilot/gpt-5-mini` during Batch 003 execution. This folder is prepared only; no issue run has been executed yet.

## Validation

Primary validation command:

```bash
npm run compile -- -p tsconfig.test.json && npx mocha --enable-source-maps ./test/*.mjs --require ./test/before.mjs --timeout=24000 --check-leaks
```

If the issue cannot be reproduced or no code change is appropriate, preserve that outcome with `reproduction-notes.md` or `no-changes.md` in `evidence/`; do not force a patch.
