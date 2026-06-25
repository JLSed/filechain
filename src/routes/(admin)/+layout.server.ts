import type { LayoutServerLoad } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';
import { redirect, error } from '@sveltejs/kit';
import { canAccessRoute, getDefaultRouteForRole } from '$lib/constants/LinkData';
import { fetchUserPermissions } from '$lib/services/permissions';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
	const { session } = await safeGetSession();

	if (!session) {
		throw redirect(303, '/login');
	}

	const { data, error: fetchError } = await supabase
		.schema('api')
		.from('user_profiles')
		.select('*')
		.eq('user_id', session.user.id)
		.single();

	if (fetchError) {
		throw error(
			500,
			'We encountered an error while fetching your data. This could be due to a network issue or the server might be temporarily unavailable.'
		);
	}

	const user_profile = UserProfileSchema.safeParse(data);

	if (!user_profile.success) {
		console.error('Profile data mismatch:', user_profile.error.flatten());
		throw error(500, 'Unable to retrieve user profile');
	}

	// ── Fetch user permissions from database ──
	const role = user_profile.data.role;
	const permissions = await fetchUserPermissions(supabase, session.user.id, role);

	// ── Permission-based route guard ──
	if (!canAccessRoute(role, url.pathname, permissions)) {
		throw redirect(303, getDefaultRouteForRole(role, permissions));
	}

	const { data: secretData, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('user_id')
		.eq('user_id', session.user.id)
		.maybeSingle();

	if (secretError) {
		console.error('Error fetching user_secret:', secretError);
		// If we error here, we could potentially throw instead,
		// but let's assume worst case they just don't have it.
	}

	const hasMasterPassword = !!secretData;

	return { profile: user_profile.data, hasMasterPassword, permissions };
};
