import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (session) {
		const { data: profile, error: profileError } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('*')
			.eq('user_id', session.user.id)
			.single();
		if (profileError) return null;
		console.log('Profile data:', profile);
		return { profile };
	}
	return null;
};
