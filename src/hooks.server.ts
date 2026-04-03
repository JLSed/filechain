import { authRoutes, protectedRoutes } from '$lib/constants/LinkData';
import { createServerClient } from '$lib/services/supabase/server';
import type { UserMetadata } from '$lib/types/DatabaseTypes';
import type { Session } from '@supabase/supabase-js';
import { type Handle, redirect } from '@sveltejs/kit';

/**
 * SvelteKit server hook – runs on **every** server request (including
 * prefetch/preload requests triggered by hovering links).
 *
 * ### Auth strategy (two tiers)
 *
 * 1. **Fast path (route guarding)** – reads the JWT from cookies via
 *    `getSession()`. This is a **local** operation with zero network
 *    overhead and is sufficient to decide whether to redirect.
 *
 * 2. **Verified path (on-demand)** – `safeGetSession()` calls
 *    `getUser()` which verifies the JWT with the Supabase Auth server.
 *    This is **lazy**: it only runs when a loader or action explicitly
 *    calls `event.locals.safeGetSession()`. The result is cached
 *    per-request so multiple callers only trigger one round-trip.
 *
 * This prevents hover-triggered preloads from spamming the database
 * with `getUser()` calls on every mouseover.
 */
export const handle: Handle = async ({ event, resolve }) => {
	// Skip auth entirely for static assets and SvelteKit internals
	if (event.url.pathname.startsWith('/_app') || event.url.pathname === '/favicon.ico') {
		return resolve(event);
	}

	// ── 1. Build the server client (reads & writes cookies) ──
	const supabase = createServerClient(event);
	event.locals.supabase = supabase;

	// ── 2. Set up the lazy, cached safeGetSession helper ──
	let cachedSession: { session: Session | null; user_metadata: UserMetadata | null } | null = null;

	event.locals.safeGetSession = async () => {
		// Return the cached result if we already verified this request
		if (cachedSession) return cachedSession;

		const UNAUTHENTICATED = { session: null, user_metadata: null };

		// Verify the token with the Auth server (network call)
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

		if (!session) {
			cachedSession = UNAUTHENTICATED;
			return UNAUTHENTICATED;
		}
		const result = { session, user_metadata: user };
		cachedSession = result;
		event.locals.session = session;
		return result;
	};

	// ── 3. Fast route guard using local JWT only (no network call) ──
	// getSession() reads the JWT from cookies without contacting the
	// auth server — perfect for quick redirect decisions.
	const {
		data: { session: localSession }
	} = await supabase.auth.getSession();

	const { pathname } = event.url;
	const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
	const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

	// Redirect unauthenticated users away from protected pages
	if (isProtected && !localSession) {
		redirect(303, '/login');
	}

	// Redirect authenticated users away from auth pages (login/register)
	if (isAuthRoute && localSession) {
		redirect(303, '/dashboard');
	}

	// ── 4. Resolve the request ──
	// Note: safeGetSession() is NOT called here. It will only run
	// if a loader or action explicitly invokes it, avoiding unnecessary
	// auth server round-trips on preload/prefetch requests.
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
