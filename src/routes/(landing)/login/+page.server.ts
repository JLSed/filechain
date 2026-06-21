import { LoginFormSchema } from '$lib/types/FormTypes.js';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';

export const load = (async () => {
	return { form: superValidate(zod(LoginFormSchema)) };
}) satisfies PageServerLoad;

/** In-memory map tracking consecutive failed login attempts per email */
const failedAttempts = new Map<string, number>();

export const actions = {
	login: async ({ request, locals: { supabase }, getClientAddress }) => {
		const form = await superValidate(request, zod(LoginFormSchema));
		if (!form.valid) return fail(400, { form });

		const email = form.data.email;
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password: form.data.password
		});

		if (error) {
			// Track failed attempts
			const count = (failedAttempts.get(email) ?? 0) + 1;
			failedAttempts.set(email, count);

			if (count >= 5) {
				// Call the RPC to log 5 consecutive failed attempts
				const { error } = await supabase.schema('api').rpc('log_failed_login', {
					p_email: email,
					p_ip_address: ipAddress
				});
				// Reset counter after logging
				failedAttempts.delete(email);
				if (error) {
					console.log(error);
				}
			}

			return message(form, `Login Failed. ${error.message}`, { status: 401 });
		}

		// Reset failed attempts on successful login
		failedAttempts.delete(email);

		// Check MFA assurance level to decide where to redirect
		const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

		if (aalData?.nextLevel === 'aal2') {
			// User has enrolled factors — needs to verify
			redirect(303, '/login/verify-2fa');
		}

		// No factors enrolled — needs to set up 2FA
		redirect(303, '/login/setup-2fa');
	}
};
