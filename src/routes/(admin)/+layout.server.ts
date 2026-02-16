import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, session } }) => {
	if (session) {
		const { data: profile, error: profileError } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('*')
			.eq('user_id', session.user.id)
			.single();
		if (profileError) {
			console.error('Profile error:', profileError);
			return { profile: null };
		}
		console.log('Profile data:', profile);
		return { profile };
	}
	return { profile: null };
};
