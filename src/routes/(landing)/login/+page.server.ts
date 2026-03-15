import { LoginFormSchema } from '$lib/types/FormTypes.js';
import { message, superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import type { PageServerLoad } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async () => {
	return { form: superValidate(zod(LoginFormSchema)) };
}) satisfies PageServerLoad;

/** In-memory map tracking consecutive failed login attempts per email */
const failedAttempts = new Map<string, number>();

export const actions = {
	login: async ({ request, locals: { supabase }, getClientAddress }) => {
		const form = await superValidate(request, zod(LoginFormSchema));
		if (!form.valid) return fail(400, { form });

		if (!supabase)
			return message(
				form,
				'Unable to connect to the authentication service. Please try again later.',
				{ status: 500 }
			);

		const email = form.data.email;
		const ipAddress = getClientAddress();

		const { data, error } = await supabase.auth.signInWithPassword({
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

		// Log successful login
		if (data.user) {
			const { data: profile } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('first_name, middle_name, last_name')
				.eq('user_id', data.user.id)
				.single();

			const actorName = profile
				? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
				: email;

			await insertAuditLog(supabase, {
				actorId: data.user.id,
				details: `${actorName}[IP: ${ipAddress}] Logged In`,
				severityLevel: 'notice',
				ipAddress,
				eventType: 'Logged In'
			});
		}

		redirect(303, '/dashboard');
	}
};
