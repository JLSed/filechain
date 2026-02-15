import type { LayoutServerLoad } from './$types';

/**
 * Root layout server load – runs on every navigation.
 *
 * Passes the verified session down to all pages and layouts so the
 * client can hydrate a browser Supabase client with the current tokens.
 */
export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, depends }) => {
	// Re-run this loader whenever the Supabase auth state changes
	depends('supabase:auth');

	const { session, user_metadata } = await safeGetSession();

	return { session, user_metadata };
};
