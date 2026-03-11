import { LoginFormSchema } from '$lib/types/FormTypes.js';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load = (async () => {
	return { form: superValidate(zod(LoginFormSchema)) };
}) satisfies PageServerLoad;

export const actions = {
	login: async ({ request, locals: { supabase } }) => {
		const form = await superValidate(request, zod(LoginFormSchema));
		if (!form.valid) return fail(400, { form });

		if (!supabase)
			return message(
				form,
				'Unable to connect to the authentication service. Please try again later.',
				{ status: 500 }
			);

		const { error } = await supabase.auth.signInWithPassword({
			email: form.data.email,
			password: form.data.password
		});

		if (error) return message(form, `Login Failed. ${error.message}`, { status: 401 });

		redirect(303, '/dashboard');
	}
};
