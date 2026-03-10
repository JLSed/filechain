import { createServerClient as createClient } from '@supabase/ssr';
import type { RequestEvent } from '@sveltejs/kit';

/**
 * Creates a Supabase server client wired to SvelteKit's cookie API.
 *
 * The `setAll` callback solves the same bidirectional cookie problem
 * described in the Next.js middleware: it updates both the current
 * request (so server load functions see the fresh token) **and** the
 * outgoing response (so the browser saves it for next time).
 */
export function createServerClient(event: RequestEvent) {
	const url = import.meta.env.VITE_SUPABASE_URL;
	const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
	if (!url || !key) return null;
	return createClient(url, key, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, {
						...options,
						path: '/'
					});
				});
			}
		}
	});
}
