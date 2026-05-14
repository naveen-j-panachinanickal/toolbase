# Release Process

## Release Criteria
1. CI passes on target branch.
2. Tool metadata and route integrity verified.
3. PWA behavior validated (cache and update path).
4. Critical tool smoke tests completed.

## Pre-Release Checklist
1. Confirm no broken tool routes.
2. Validate no stale or misleading tool descriptions.
3. Confirm privacy-first behavior for changed tools.
4. Update docs for any architecture changes.

## Post-Release Checks
1. Open app and verify home + tool navigation.
2. Smoke-test critical tools (Magic PDF, Data Lens, OmniParse, Data Forge).
3. Confirm worker-based tools initialize successfully.

