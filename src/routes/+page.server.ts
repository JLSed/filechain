import type { Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { SetupMasterPasswordSchema } from '$lib/types/FormTypes';

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		const { error: fetchError } = await supabase.auth.signOut();

		if (fetchError) {
			return fail(500, { message: `Sign Out Failed. ${fetchError.message}` });
		}

		redirect(303, '/login');
	},
	setupMasterKey: async ({ request, locals: { supabase, safeGetSession } }) => {
		const form = await superValidate(request, zod(SetupMasterPasswordSchema));
		if (!form.valid) return fail(400, { form });

		const { session } = await safeGetSession();
		if (!session) {
			return fail(401, { message: 'Unauthorized access. Please login.' });
		}

		const { error: insertError } = await supabase.from('user_secret').insert({
			user_id: session.user.id,
			encrypted_private_key: form.data.encrypted_private_key,
			public_key: form.data.public_key,
			pk_salt: form.data.pk_salt,
			pk_nonce: form.data.pk_nonce,
			recovery_encrypted_private_key: form.data.recovery_encrypted_private_key || null,
			recovery_salt: form.data.recovery_salt || null,
			recovery_nonce: form.data.recovery_nonce || null
		});

		if (insertError) {
			console.error('Failed to create master key:', insertError);
			return fail(500, { message: `Failed to save master key. ${insertError.message}` });
		}

		return { form };
	}
};
