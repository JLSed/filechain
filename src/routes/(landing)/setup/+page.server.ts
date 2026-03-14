import type { PageServerLoad, Actions } from './$types';
import { SetupAccountFormSchema } from '$lib/types/FormTypes';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { redirect, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	// Must have a session (from the invite callback)
	if (!session || !supabase) {
		redirect(303, '/login');
	}

	// Check if user already completed setup (has a master key)
	const { data: secretData } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('user_id')
		.eq('user_id', session.user.id)
		.maybeSingle();

	if (secretData) {
		// Already set up — redirect to dashboard
		redirect(303, '/dashboard');
	}

	return {
		form: await superValidate(zod(SetupAccountFormSchema))
	};
};

export const actions: Actions = {
	setupAccount: async ({ request, locals: { supabase, safeGetSession } }) => {
		const form = await superValidate(request, zod(SetupAccountFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const { session } = await safeGetSession();
		if (!session) {
			return message(form, 'Your session has expired. Please use the invite link again.', {
				status: 401
			});
		}

		if (!supabase) {
			return message(form, 'A server configuration error occurred. Unable to connect.', {
				status: 500
			});
		}

		// 1. Set the user's password
		const { error: passwordError } = await supabase.auth.updateUser({
			password: form.data.password
		});

		if (passwordError) {
			console.error('Password update error:', passwordError);
			return message(form, `Failed to set password: ${passwordError.message}`, {
				status: 500
			});
		}

		// 2. Save the master key
		const { error: secretError } = await supabase
			.schema('api')
			.from('user_secrets')
			.insert({
				user_id: session.user.id,
				encrypted_private_key: form.data.encrypted_private_key,
				public_key: form.data.public_key,
				pk_salt: form.data.pk_salt,
				pk_nonce: form.data.pk_nonce
			});

		if (secretError) {
			console.error('Master key save error:', secretError);
			return message(
				form,
				`Password was set but master key setup failed: ${secretError.message}. Please contact an administrator.`,
				{ status: 500 }
			);
		}

		redirect(303, '/dashboard');
	}
};
