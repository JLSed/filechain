import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const actions: Actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { message: 'Email and password are required', email });
		}

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) {
			return fail(401, { message: error.message, email });
		}

		redirect(303, '/dashboard');
	}
};
