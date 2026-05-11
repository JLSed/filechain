import { ForgotPasswordSchema } from '$lib/types/FormTypes.js';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load = (async () => {
	return { form: await superValidate(zod(ForgotPasswordSchema)) };
}) satisfies PageServerLoad;

export const actions = {
	forgotPassword: async ({ request, url, locals: { supabase } }) => {
		const form = await superValidate(request, zod(ForgotPasswordSchema));
		if (!form.valid) return fail(400, { form });

		const redirectTo = `${url.origin}/auth/confirm?type=recovery`;

		// Always show success to prevent email enumeration
		const { error } = await supabase.auth.resetPasswordForEmail(form.data.email, {
			redirectTo
		});

		if (error) {
			console.error('Forgot password error:', error);
		}

		return { form, emailSent: true };
	}
} satisfies Actions;
