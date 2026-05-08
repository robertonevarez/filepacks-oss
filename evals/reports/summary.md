# filepacks eval summary

Generated: 2026-05-08T18:33:34.911Z

## Overview

- Runs: 15
- Measured artifacts: 7
- Verification pass rate: 100% (7/7)
- Average review duration: n/a minutes
- Expected evidence paths: 76
- Present expected evidence paths: 29
- Missing expected evidence paths: 47
- Compared changed files: 0

## Current State

- Measured artifacts: 7
- Completed runs: 5
- Incomplete measured artifacts: 2
- Infra failures: 2
- Invalid packaging attempts: 2
- No-repro/no-change artifacts: 1
- Not executed runs: 1

No improvement claims are supported yet. The strongest current finding is protocol-level: deterministic finalization improved valid artifact production compared with executor-created packaging.

## Decisions

- needs_review: 2

## Runs

| Run | Status | Task | Repo | Measured | Verify | Decision | Confidence | Missing Evidence | Changed Files |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| run-0001 | completed | bugfix | sindresorhus/ky | yes | pass | needs_review | n/a | 1 |  |
| run-0002 | failed | docs_update | sindresorhus/ky | no | n/a | n/a | n/a | n/a |  |
| run-0003 | completed | refactor | tj/commander.js | yes | pass | needs_review | n/a | 0 |  |
| run-0004 | failed | bugfix | tj/commander.js | no | n/a | n/a | n/a | n/a |  |
| run-0005 | incomplete | test_repair | pypa/pipx | no | n/a | n/a | n/a | n/a |  |
| run-0006 | incomplete | bugfix | pypa/pipx | no | n/a | n/a | n/a | n/a |  |
| run-0007 | incomplete | refactor | pypa/pipx | no | n/a | n/a | n/a | n/a |  |
| run-0008 | incomplete | docs_update | pypa/pipx | no | n/a | n/a | n/a | n/a |  |
| run-0009 | not_executed | bugfix | go-task/task | no | n/a | n/a | n/a | n/a |  |
| run-0010 | incomplete | bugfix | sindresorhus/ky | no | n/a | n/a | n/a | n/a |  |
| run-0011 | incomplete | bugfix | ljharb/qs | yes | pass | n/a | n/a | 8 |  |
| run-0012 | incomplete | refactor | ljharb/qs | yes | pass | n/a | n/a | 12 |  |
| run-0013 | completed | refactor | ljharb/qs | yes | pass | n/a | n/a | 8 |  |
| run-0014 | completed | bugfix | yargs/yargs | yes | pass | n/a | n/a | 9 |  |
| run-0015 | completed | bugfix | yargs/yargs | yes | pass | n/a | n/a | 9 |  |

