import { createClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

/**
 * Creates a Supabase admin client using the service role key.
 * bypasses RLS and has full access — use only in server-side code.
 *
 * Defaults to 'public' schema for direct table writes.
 * Use `.schema('api')` for reads through API views.
 */
export function createAdminClient() {
	return createClient(import.meta.env.VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});
}
