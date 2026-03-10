import type { Actions } from './$types';
import { fail, error, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		if (!supabase) {
			console.error('Server configuration error: Missing connection details.');
			throw error(500, 'A server configuration error occurred. Unable to connect to the database.');
		}

		const { error: fetchError } = await supabase.auth.signOut();

		if (fetchError) {
			return fail(500, { message: `Sign Out Failed. ${fetchError.message}` });
		}

		redirect(303, '/login');
	}
};
