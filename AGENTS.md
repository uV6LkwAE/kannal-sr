# Coding Rules

- Use `apply_patch` for file edits.
- Avoid deprecated APIs, functions, and patterns.
- Prefer fail-fast validation for runtime configuration.
- Do not add default values for required environment variables.
- Read environment variables through `src/config/env.ts` and keep `process.env` access centralized.
- Use `Vitest` for tests and prefer `toThrow` over `toThrowError`.
- Keep test fixtures explicit and deterministic.
- Do not overwrite user changes unless the task explicitly requires it.
