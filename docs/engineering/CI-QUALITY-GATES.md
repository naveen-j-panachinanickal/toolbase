# CI and Quality Gates

## Minimum Gates
1. Install dependencies cleanly.
2. Lint passes.
3. Type-check passes.
4. Test suite passes (as introduced per module).

## Suggested Pipeline Stages
1. `lint`
2. `type-check`
3. `unit-tests`
4. `integration-tests`
5. `visual-regression` (for changed tool UI)

## Merge Rules
1. No failing gate.
2. No architecture boundary violation.
3. Registry metadata must stay accurate.
4. Docs updated for behavior/architecture changes.

