import { redirect, type RequestHandler } from '@sveltejs/kit';
import type { EmailOtpType } from '@supabase/supabase-js';

/**
 * Server-side auth confirmation endpoint.
 *
 * Handles TWO verification mechanisms:
 *
 * 1. **PKCE code exchange** (`?code=...`) — Used by SSR-initiated flows
 *    like `resetPasswordForEmail` where the PKCE code verifier is stored
 *    in cookies by @supabase/ssr.
 *
 * 2. **Token hash verification** (`?token_hash=...&type=...`) — Used by
 *    custom email templates that link directly here via
 *    `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=invite`.
 *    This is more secure than the implicit flow because tokens never
 *    appear in the URL hash (visible to client-side scripts).
 *
 * This is a SEPARATE route from /auth/callback because SvelteKit
 * routes browser navigations to +page.svelte when both +page.svelte
 * and +server.ts exist at the same path.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	const next = url.searchParams.get('next') ?? '/dashboard';

	// --- Flow 1: PKCE code exchange (from SSR-initiated auth flows) ---
	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Auth confirm: Failed to exchange code for session:', error.message);
			redirect(303, '/login?error=auth_failed');
		}

		return routeByType(type, next);
	}

	// --- Flow 2: Token hash verification (from custom email templates) ---
	if (tokenHash && type) {
		const { error } = await supabase.auth.verifyOtp({
			token_hash: tokenHash,
			type: type as EmailOtpType
		});

		if (error) {
			console.error('Auth confirm: Failed to verify token hash:', error.message);
			redirect(303, '/login?error=auth_failed');
		}

		return routeByType(type, next);
	}

	// No valid parameters — redirect to login
	console.error('Auth confirm: No code or token_hash found in URL');
	redirect(303, '/login?error=no_code');
};

/**
 * Redirect the user based on the auth flow type.
 */
function routeByType(type: string | null, fallback: string): never {
	if (type === 'recovery') {
		redirect(303, '/reset-password');
	} else if (type === 'invite') {
		redirect(303, '/setup');
	} else {
		redirect(303, fallback);
	}
}
