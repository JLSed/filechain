import { redirect, type RequestHandler } from '@sveltejs/kit';

/**
 * Server-side auth callback for PKCE flow (password reset, etc).
 *
 * This is a SEPARATE route from /auth/callback because SvelteKit
 * routes browser navigations to +page.svelte when both +page.svelte
 * and +server.ts exist at the same path. The /auth/callback route
 * uses +page.svelte for the implicit/hash flow (invites), so PKCE
 * flows redirect here instead.
 *
 * The PKCE code verifier is stored in cookies by @supabase/ssr.
 * The server-side supabase client (from hooks) has access to these
 * cookies, so code exchange works correctly here.
 */
export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');
	const type = url.searchParams.get('type');
	const next = url.searchParams.get('next') ?? '/dashboard';

	if (code) {
		const { error } = await supabase.auth.exchangeCodeForSession(code);

		if (error) {
			console.error('Auth confirm: Failed to exchange code for session:', error.message);
			redirect(303, '/login?error=auth_failed');
		}

		// Route based on the auth flow type
		if (type === 'recovery') {
			redirect(303, '/reset-password');
		} else if (type === 'invite') {
			redirect(303, '/setup');
		} else {
			redirect(303, next);
		}
	}

	// No code present — redirect to login
	console.error('Auth confirm: No code found in URL');
	redirect(303, '/login?error=no_code');
};
