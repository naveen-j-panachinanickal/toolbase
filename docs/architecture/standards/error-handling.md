# Error Handling Standard

## Goal
Unify how tools report and display failures.

## Result Shape
Use a normalized result where practical:

```ts
type OperationResult<T> = {
  ok: boolean;
  data?: T;
  errors: string[];
  warnings: string[];
};
```

## Rules
1. User-correctable issues must be clear and actionable.
2. Validation errors are listed inline as bullet points.
3. Internal/runtime failures use generic safe messages plus technical logs in console.
4. Avoid silent failures.

## UX Display
1. `errors` in danger style block.
2. `warnings` in warning style block.
3. Keep status badge, but never hide root cause in tooltip-only text.

