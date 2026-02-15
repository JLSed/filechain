import { authRoutes, protectedRoutes } from '$lib/constants/constant';
import { createServerClient } from '$lib/services/supabase/server';
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
	if (
		event.url.pathname.startsWith('/_app') ||
		event.url.pathname.includes('.') || // cheap way to skip files with extensions (css, png, ico)
		event.url.pathname === '/favicon.ico'
	) {
		return resolve(event);
	}
	// ── 1. Build the server client (reads & writes cookies) ──
	const supabase = createServerClient(event);
	event.locals.supabase = supabase;

	/**
	 * A convenience helper that wraps `supabase.auth.getSession()` but only
	 * exposes the data – never trusts the JWT on its own.  `getUser()` makes
	 * a round-trip to the Supabase Auth server so the session is verified.
	 */
	event.locals.safeGetSession = async () => {
		const UNAUTHENTICATED = { session: null, user_metadata: null };
		// Verify the token with the Auth server first
		const {
			data: { user },
			error
		} = await supabase.auth.getUser();

		if (error || !user) return UNAUTHENTICATED;
		// Only if valid, retrieve the session (which contains the tokens)
		const {
			data: { session }
		} = await supabase.auth.getSession();

		// JWT expired or invalid – treat as logged-out
		if (!session) return UNAUTHENTICATED;

		console.log('Hook ran at', new Date().toISOString());
		event.locals.session = session;
		return { session, user_metadata: user };
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
