# Testing Strategy

## Test Pyramid
1. Unit: `modules/*/lib` pure logic.
2. Integration: tool workflows in UI + hooks.
3. Visual regression: shell consistency and key states.

## Minimum Per Tool
1. Parse/transform success case.
2. Invalid input error case.
3. One edge case specific to tool domain.
4. UI state check (loading/error/success).

## CI Gates
1. `npm run lint`
2. `npm run type-check`
3. test suite pass
4. visual baseline checks for changed tool pages

