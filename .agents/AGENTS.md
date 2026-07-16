<!-- BEGIN:sveltekit-svelte5-rules -->
# SvelteKit & Svelte 5 Rules

Refer to [.github/instructions/svelte.instructions.md](file:///c:/filechain/.github/instructions/svelte.instructions.md) for SvelteKit and Svelte 5 coding guidelines and architecture.
Refer to [.agents/rules/svelte.md](file:///c:/filechain/.agents/rules/svelte.md) for key Svelte rules.

- **Exclusively Use Svelte 5 Runes**: Always use `$state`, `$derived`, `$props`, and `$effect` for state management and reactivity. Never use legacy Svelte 4 syntax like `$:`, `export let`, or `on:` prefixed event handlers.
- **Event Handlers**: Use modern lower-case attributes for event handlers (e.g., `onclick`, `oninput`, `onkeydown`) rather than the `on:` prefix.
- **State Access**: Import and use `{ page }` from `$app/state` instead of utilizing the legacy `$app/stores` modules.
- **Clean Page Pattern**: Keep `+page.svelte` files clean and focused on markup and component composition. Move complex sorting, filtering, pagination, or form states into class controllers inside companion `.svelte.ts` files.
- **Client-Side Filtering & Sorting**: Do not parse `url.searchParams` in server load functions (`+page.server.ts`) for data filtering. Fetch raw data once, read `page.url.searchParams` reactively in the Svelte component, filter/sort using `$derived`, and perform shallow routing using `replaceState` or `pushState` from `$app/navigation` to update search parameters without reloading.
- **Forms & Mutations**: Prefer SvelteKit Form Actions in `+page.server.ts` combined with `use:enhance` in components for mutations over manual `fetch` requests.
- **Folder Structure**: Group routes by group directories like `(admin)`, `(landing)`, `(client)`, and `(home)`. Group matching reusable components in `src/lib/components/` under mirroring folders.
<!-- END:sveltekit-svelte5-rules -->

<!-- BEGIN:typescript-rules -->
# TypeScript Rules

Refer to [.github/instructions/typescript.instructions.md](file:///c:/filechain/.github/instructions/typescript.instructions.md) for complete guidelines on ES6+, types, interfaces, error handling, and testing.
Refer to [.agents/rules/typescript.md](file:///c:/filechain/.agents/rules/typescript.md) and [.agents/skills/enforcing-typescript-standards/SKILL.md](file:///c:/filechain/.agents/skills/enforcing-typescript-standards/SKILL.md) for typescript standard enforcements.

- **Strict Typing & Annotations**: Enable strict mode. Always add type annotations for function parameters and return values.
- **Interfaces & Types**: Prefer `interface` for object shapes, `type` for unions/complex shapes, and `enum` for fixed sets of values.
- **Avoid Any**: Never use `any` unless absolutely unavoidable; use `unknown` instead. Use type guards and discriminated unions to narrow types.
- **Error Handling**: Always wrap asynchronous operations in `try/catch` blocks. Use custom error classes with meaningful error context rather than swallowing errors.
- **Functional Programming**: Prefer pure functions, immutable data updates, and array methods (`map`, `filter`, `reduce`) over loop iterations.
- **JSDoc/TSDoc Comments**: Document complex functions, classes, and types with JSDoc block comments including parameters, return types, and exceptions.
<!-- END:typescript-rules -->

<!-- BEGIN:supabase-database-rules -->
# Supabase & Database Rules

Refer to [.github/instructions/database.instructions.md](file:///c:/filechain/.github/instructions/database.instructions.md) for database schema design, index planning, prepared statements, and security configurations.
Refer to [.agents/rules/backend.md](file:///c:/filechain/.agents/rules/backend.md) for Supabase project definitions.

- **Supabase Project Identification**: When interacting with the database/backend, always verify with the Supabase MCP. The target project name is `novault (jmssaxzzkiinggkburfc)`.
- **Security Invoker over Definer**: Prefer `SECURITY INVOKER` functions to respect Row Level Security (RLS). If `SECURITY DEFINER` is required, you must manually validate inputs, verify user permissions/quotas, and ALWAYS pin the `search_path` (e.g. `SET search_path = public`) to prevent privilege escalation attacks.
- **View Security Invariant**: ALWAYS define views with `WITH (security_invoker = on)` to ensure the invoker's RLS policies are applied on underlying tables. Avoid creating views with definer privileges.
- **RLS Policy Performance**: Wrap auth/session function calls (like `auth.uid()`) in scalar subqueries inside RLS policies (e.g. `(SELECT auth.uid()) = user_id`) to avoid overhead from per-row function evaluation.
- **Migrations**: Always schema change via database migrations. Never apply schema updates manually on staging/production environments.
<!-- END:supabase-database-rules -->

<!-- BEGIN:rust-wasm-rules -->
# Rust & WebAssembly Guidelines

Refer to [project.instructions.md](file:///c:/filechain/.github/instructions/project.instructions.md) for WASM compilation and encryption guidelines.

- **Client-Side Encryption Invariant**: All cryptographic encryption and decryption operations **must** occur client-side within the compiled WebAssembly (Rust) module. Never transmit unencrypted secret keys or plaintext content.
- **Rust compilation**: Rust code resides in `rust/src/`. Compile using `npm run build:wasm`. The build target is located at `src/lib/pkg/`.
- **Imports & Initialization**: Import WASM helper utilities from `$lib/pkg/rust`. Ensure top-level await is configured properly in `vite.config.ts`.
<!-- END:rust-wasm-rules -->

<!-- BEGIN:shadcn-tailwind-styling-rules -->
# UI Component & Styling Rules

Refer to [project.instructions.md](file:///c:/filechain/.github/instructions/project.instructions.md) for Tailwind CSS 4 details and shadcn/ui guidelines.

- **Check shadcn/ui MCP**: Before building any UI component from scratch, query the shadcn/ui MCP server to check if an implementation or composite layout block is available. Adapt/reuse shadcn/ui components instead of building custom.
- **shadcn/ui Paths**: All shadcn/ui components belong in `src/lib/shadcn/components/` and are imported via the `$lib/shadcn/components/ui/` path.
- **Tailwind 4 CSS Variables**: Prefer utility classes over inline styles. Access theme colors and backgrounds via CSS custom properties mapped in Tailwind (e.g. `bg-[--background]`, `text-[--foreground]`).
<!-- END:shadcn-tailwind-styling-rules -->

<!-- BEGIN:ponytail-lazy-dev-rules -->
# Ponytail (Lazy Senior Dev Mode)

Refer to [.agents/rules/ponytail.md](file:///c:/filechain/.agents/rules/ponytail.md) for ponytail dev guidelines.

- **YAGNI & Simplicity**: Write the minimum code that works. Avoid creating abstractions, introducing new dependencies, or writing boilerplate unless explicitly requested. Deletion over addition.
- **Mark intentional shortcuts**: Document intentional simplifications or known ceilings with a `ponytail:` comment specifying the upgrade path.
- **Logic Tests**: Ensure non-trivial code logic is accompanied by a runnable check/test to verify correctness.
<!-- END:ponytail-lazy-dev-rules -->

<!-- BEGIN:vercel-optimization-rules -->
# Vercel Optimization Rules

Refer to [.agents/skills/vercel-optimize/SKILL.md](file:///c:/filechain/.agents/skills/vercel-optimize/SKILL.md) for middleware matchers, edge request optimization, Vercel caching, and running automated performance audits.
<!-- END:vercel-optimization-rules -->

<!-- BEGIN:wcag-accessibility-rules -->
# WCAG 2.2 Accessibility Rules

Refer to [.agents/skills/wcag-audit-patterns/SKILL.md](file:///c:/filechain/.agents/skills/wcag-audit-patterns/SKILL.md) for WCAG 2.2 AA conformance (semantic HTML, keyboard operability, forms, color/contrast, media, links, and accessibility audits).
<!-- END:wcag-accessibility-rules -->
