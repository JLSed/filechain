---
applyTo: '**'
---

Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

# GitHub Copilot Instructions for Filechain

## Project Overview

Filechain is a secure cloud storage solution with zero-knowledge encryption built with:

- **SvelteKit 2**
- **Svelte 5** (Runes)
- **TypeScript 5**
- **Tailwind CSS 4**
- **Rust/WebAssembly** for client-side encryption (AES-256-GCM)

---

## Code Organization Rules

### Components & Routes

1. **Pages & Layouts:** Located in `src/routes/`. Follow SvelteKit file-based routing standards (`+page.svelte`, `+layout.svelte`, `+server.ts`).
2. **Reusable Components:** Place in `src/lib/components/` or under `src/lib/`.
3. **Imports:** Use the `$lib` alias for imports (e.g., `import Button from "$lib/components/Button.svelte"`).

### Functions & Utilities

4. **Reusable Logic:** Place utility functions in `src/lib/utils/`.
5. **Server-Side Logic:** 
   - Use `+page.server.ts` or `+layout.server.ts` for data loaders and form actions.
   - Use `+server.ts` for API endpoints.
   - **Do not** create separate `actions.ts` files; use standard SvelteKit form actions.
6. **Stores/State:** Use Svelte 5 runes (`$state`, `$derived`, `$effect`) for local and global state management. Avoid legacy stores (`writable`, `readable`) unless interfacing with older libraries.

---

## Styling Guidelines

### Tailwind CSS

7. **Configuration:** Tailwind 4 is configured. Use utility classes directly in `class` attributes.
8. **Global Styles:** Defined in `src/routes/layout.css`.
9. **Colors:**
   - Use CSS variables defined in `@theme` or `:root` (e.g., `bg-[--background]`, `text-[--foreground]`).
   - Prefer Tailwind utility classes over inline styles.

---

## WebAssembly / Rust Guidelines

10. **Source Code:** Rust code is located in `rust/src/`.
11. **Build:** Run `npm run build:wasm` to compile Rust code.
12. **Output:** Compiled WASM is located in `src/lib/pkg/`.
13. **Usage:**
    - Import WASM functions in Svelte components or TS files from `$lib/pkg/rust`.
    - Ensure WASM initialization is handled (checking top-level await in `vite.config.ts`).
    - **Encryption:** All cryptographic operations (encryption/decryption) **must** happen client-side using the WASM module.

---

## File Structure Conventions

```
src/
  lib/            # Shared code ($lib alias)
    components/   # Reusable Svelte components
    pkg/          # Compiled WebAssembly (do not edit manually)
    utils/        # Helper functions
  routes/         # SvelteKit pages and API endpoints
static/           # Static assets (robots.txt, favicon, etc.)
rust/             # Rust source code for WASM
e2e/              # Playwright end-to-end tests
```

---

## TypeScript Conventions

15. **Strict Mode:** TypeScript `strict: true` is enabled.
16. **Types:** Define interfaces/types in `src/lib/types/` or co-locate with components.
17. **Svelte 5:** Use `Snippet`, `Component` types from `svelte` where applicable.

---

## Supabase Guidelines

18. **Schema:** Use the `api` schema for database queries if applicable.
19. **Client:** Initialize Supabase client via environment variables and standard connection patterns.
20. **Security:** Use RLS (Row Level Security) on the database side.

---

## Best Practices

21. **Svelte 5 Runes:** Use `$props()` for component props, `$state()` for reactive state.
    ```svelte
    <script lang="ts">
      let { count = 0 } = $props();
      let double = $derived(count * 2);
    </script>
    ```
22. **Performance:** Use `{@render ...}` for snippets.
23. **Security:** Never expose secret keys in client-side code.
24. **Testing:** 
    - Unit tests: `*.test.ts` (Vitest).
    - E2E tests: `e2e/*.test.ts` (Playwright).
