---
trigger: always_on
---

When working with `.ts`, `.tsx`, or `.svelte` files, always follow the guidelines in `.github/instructions/typescript.instructions.md`. Key points:

- Use ES6+ features: `const`/`let` (never `var`), arrow functions, template literals, destructuring, async/await, ES modules.
- Always add type annotations for function parameters and return values.
- Use `interface` for object shapes, `type` for unions/complex types, `enum` for fixed sets.
- Use `unknown` instead of `any` when the type is truly unknown. Never use `any` unless unavoidable.
- Use type guards and discriminated unions to narrow types.
- Always use try/catch for async operations with meaningful error messages. Never swallow errors.
- Prefer pure functions, immutable data, and Array methods (`map`, `filter`, `reduce`) over loops.
- Use `Promise.all` for parallel operations, `Promise.allSettled` for fault-tolerant parallel ops.
- Use JSDoc comments for functions, classes, and complex types.
- Validate and sanitize user input at trust boundaries. Use parameterized queries for database operations.
