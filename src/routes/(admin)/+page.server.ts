import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			return fail(500, { message: 'Failed to sign out' });
		}

		redirect(303, '/login');
	}
};
