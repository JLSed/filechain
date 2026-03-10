import type { LayoutServerLoad } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) return { profile: null };

	// TODO: redirect user to login and show an error saying fetching user profile did not work so they should try again. instead of returning profile as null

	if (!supabase) return { profile: null };

	const { data, error } = await supabase
		.schema('api')
		.from('user_profiles')
		.select('*')
		.eq('user_id', session.user.id)
		.single();

	if (error) {
		console.log('Error');
		return { profile: null };
	}

	const user_profile = UserProfileSchema.safeParse(data);

	if (!user_profile.success) {
		console.error('Profile data mismatch:', user_profile.error.flatten());
		return { profile: null };
	}

	return { profile: user_profile.data };
};
