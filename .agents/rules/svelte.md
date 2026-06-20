---
trigger: always_on
---

When working with `.svelte` or `.svelte.ts` files, always follow the guidelines in `.github/instructions/svelte.instructions.md`. Key points:

- Use Svelte 5 Runes exclusively (`$state`, `$derived`, `$props`, `$effect`). Never use Svelte 4 syntax (`$:`, `export let`, `on:` prefix).
- Use `$app/state` (e.g., `import { page } from '$app/state'`) instead of `$app/stores`.
- Keep `+page.svelte` clean — extract complex logic into companion `.svelte.ts` files as classes.
- Always type `load`/`data` using SvelteKit's `./$types` (e.g., `let { data }: { data: PageData } = $props()`).
- Use `depends()`/`invalidate()` for targeted re-fetching. Avoid `invalidateAll()`.
- Prefer `$derived` over `$effect`. Only use `$effect` for external side-effects.
- Prefer SvelteKit Form Actions with `use:enhance` for mutations.
- Client-side filtering: read URL params via `page.url.searchParams` in the component, not in `+page.server.ts`.
- Follow the project folder structure: routes grouped by `(admin)`, `(landing)`, `(client)`, `(home)`; components in `src/lib/components/` mirroring the route structure.
- Check `src/lib/utils/` before writing new utility functions.
