---
applyTo: '**/*.svelte.ts, **/*.svelte'
---

### SvelteKit & Svelte 5 Coding Guidelines & Project Architecture

**1. Core Philosophy & Svelte 5 Syntax**

- **Use Runes:** Exclusively use Svelte 5 Runes (`$state`, `$derived`, `$props`, `$effect`) instead of Svelte 4 reactivity (`$:`, `export let`).
- **Event Handlers:** Use modern Svelte 5 event handler syntax (e.g., `onclick`, `oninput`, `onkeydown`—all lowercase, no `on:` prefix).
- **State Access:** Use `$app/state` (e.g., `import { page } from '$app/state'`) instead of Svelte 4 stores (`$app/stores`) for accessing route data and URLs.

**2. Separation of Concerns (File Structuring)**

- **Keep `+page.svelte` clean:** The `.svelte` file should primarily handle UI markup, component composition, and binding to state.
- **Extract Complex Logic:** If a page has complex filtering, sorting, or pagination, extract the logic into a class inside a companion `.svelte.ts` file (e.g., `export class PageState { ... }`) and instantiate it in the `+page.svelte` file.
- **Extract Utilities & Constants:** Move pure formatting functions (e.g., `formatDate`) to `src/lib/utils/` and hardcoded configuration objects/styles to `src/lib/constants/`.
- **Componentize:** Break down large UIs into smaller, reusable components in `src/lib/components/`.

**3. Data Fetching & SvelteKit Routing**

- **Server Logic:** Use `+page.server.ts` for direct database queries, secrets, and server-only logic. Never put secrets in `+page.ts`.
- **Type Safety:** Always type `load` functions and `data` objects using SvelteKit's auto-generated types from `./$types` (e.g., `let { data }: { data: PageData } = $props();`).
- **Targeted Re-fetching:** Use `depends('custom:tag')` in `load` functions and `invalidate('custom:tag')` in components to refresh specific data streams without reloading the entire page.

**4. Client-Side Filtering, Sorting, and URLs**

- **Avoid URL Tracking in Server Load:** When building tables with client-side sorting/filtering, **do not** read `url.searchParams` in the `+page.server.ts` load function. Fetch the raw data once.
- **Client-Side Reactivity:** Read the URL search parameters inside the Svelte component using `page.url.searchParams` and use `$derived` to reactively filter/sort the data.
- **Shallow Routing:** Use `replaceState` or `pushState` from `$app/navigation` to update the browser's URL based on client-side filters without triggering a server-side navigation cycle.

**5. Performance & Best Practices**

- **Avoid Over-Invalidation:** Do not use `invalidateAll()` unless absolutely necessary. Target specific dependencies.
- **Minimize `$effect`:** Rely on `$derived` for computed values based on state. Only use `$effect` when you explicitly need to synchronize with an external system (like a DOM API or an external library) or trigger a side effect.
- **Forms & Mutations:** Prefer SvelteKit Form Actions (`export const actions` in `+page.server.ts`) combined with `use:enhance` for data mutations over manual `fetch` calls, to leverage progressive enhancement and automatic invalidation.

---

**Project Architecture & Folder Structure**
Strictly adhere to the following directory structure and separation of concerns:

- **`src/routes/` (Route Grouping):**
  Organize routes using SvelteKit's group directories `(...)` based on the "side" of the application they belong to:
- `(admin)`: Protected pages and layouts for the admin side of the website.
- `(landing)`: Unprotected/public pages (e.g., landing page, login, registration).
- `(client)`: Protected client-facing pages (for platforms with a client portal).
- `(home)`: Used for the primary user-facing app in simpler site structures.

- **`src/lib/` (Shared Code & Assets):**
- `services/`: Database connection logic, API clients, and third-party service integrations.
- `assets/`: SVGs, images, and other static media used in the UI.
- `classes/`: Object-Oriented Programming (OOP) classes and logic encapsulates.
- `components/`: UI components. Group these by their corresponding route (e.g., a `/dashboard` route should have its components inside `src/lib/components/dashboard/`). Reflect the `(admin)` or `(landing)` structure here if helpful.
- `types/`: Type definitions and validation schemas. **This project uses Zod and Superforms.** \* `DatabaseTypes.ts`: Database schema types.
- `FormTypes.ts`: Zod schemas and types for form validation.
- `TableTypes.ts`: Types for table rows/columns (usually combining types from `DatabaseTypes.ts`).

- `constants/`: Hardcoded configuration data, stored as `.ts` or `.json` files.
- `utils/`: Global utility functions. **AI Instruction: Always check this folder first to see if a utility function already exists before writing a new one.**
