import type { LayoutServerLoad } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';
import { redirect, error } from '@sveltejs/kit';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session || !supabase) {
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
		throw error(500, 'Unable to retreive user profile');
	}

	return { profile: user_profile.data };
};
