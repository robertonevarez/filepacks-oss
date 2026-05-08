Issue is closed upstream and focused tests for 204 responses already pass on the selected clean commit. No reproduction was necessary because the observed behavior matches the expected (tests passed).

Commands run:
- npm install --no-audit --no-fund
- npm run build
- npx ava test/body-size.ts test/main.ts --match "*204*"

Results: 4 tests passed for the 204-related tests. No code changes were made.
