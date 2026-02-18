import { authRoutes, protectedRoutes } from '$lib/constants/constant';
import { createServerClient } from '$lib/services/supabase/server';
import type { Session } from '@supabase/supabase-js';
import { type Handle, redirect } from '@sveltejs/kit';

/**
 *
 * Runs on **every server request** before the route loads.
 *
 * 1. Creates a Supabase server client wired to the request cookies.
 * 2. Calls `getUser()` which silently refreshes expired tokens
 * 3. Attaches `supabase`, `session`, and `user` to `event.locals`
 *    so every `+page.server.ts` / `+layout.server.ts` can access them.
 * 4. Protects routes: unauthenticated users hitting protected paths
 *    are redirected to `/login`.
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Don't run auth logic for static assets, favicons, or SvelteKit internal paths
	if (event.url.pathname.startsWith('/_app') || event.url.pathname === '/favicon.ico') {
		return resolve(event);
	}
	// ── 1. Build the server client (reads & writes cookies) ──
	const supabase = createServerClient(event);
	event.locals.supabase = supabase;

	/**
	 * A convenience helper that wraps `supabase.auth.getUser()` + `getSession()`.
	 * The result is cached per request so multiple callers (handle hook,
	 * layout loaders, page loaders) only trigger **one** round-trip to the
	 * Supabase Auth server instead of one per call.
	 */
	let cachedSession: { session: Session | null; user_metadata: User.Metadata | null } | null = null;

	event.locals.safeGetSession = async () => {
		// Return the cached result if we already verified this request
		if (cachedSession) return cachedSession;

		const UNAUTHENTICATED = { session: null, user_metadata: null };
		// Verify the token with the Auth server first
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();

		if (error || !user) {
			cachedSession = UNAUTHENTICATED;
			return UNAUTHENTICATED;
		}

		// Only if valid, retrieve the session (which contains the tokens)
		const {
			data: { session }
		} = await supabase.auth.getSession();

		// JWT expired or invalid – treat as logged-out
		if (!session) {
			cachedSession = UNAUTHENTICATED;
			return UNAUTHENTICATED;
		}

		console.log('auth ran at', { cachedSession });
		const result = { session, user_metadata: user };
		cachedSession = result;
		event.locals.session = session;
		return result;
	};

	// ── 2. Trigger token refresh (the "getUser()" side-effect) ──
	const { session } = await event.locals.safeGetSession();

	const { pathname } = event.url;

	const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	// Redirect unauthenticated users away from protected pages
	if (isProtected && !session) {
		redirect(303, '/login');
	}

	// Redirect authenticated users away from auth pages (login/register)
	if (isAuthRoute && session) {
		redirect(303, '/dashboard');
	}

	// ── 4. Resolve the request ──
	return resolve(event, {
		/**
		 * Supabase needs the `content-range` and `x-supabase-api-version`
		 * headers serialised. This filter lets SvelteKit pass them through.
		 */
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};
