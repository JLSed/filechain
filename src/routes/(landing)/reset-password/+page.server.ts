import type { PageServerLoad, Actions } from './$types';
import { ResetPasswordSchema, RecoverWithKeySchema } from '$lib/types/FormTypes';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { redirect, fail } from '@sveltejs/kit';
import { createAdminClient } from '$lib/services/supabase/admin';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		redirect(303, '/login');
	}

	// Check if user has recovery key material
	const { data: secretData } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('recovery_encrypted_private_key, recovery_salt, recovery_nonce')
		.eq('user_id', session.user.id)
		.maybeSingle();

	const hasRecoveryKey = !!(
		secretData?.recovery_encrypted_private_key &&
		secretData?.recovery_salt &&
		secretData?.recovery_nonce
	);

	return {
		resetForm: await superValidate(zod(ResetPasswordSchema)),
		recoverForm: await superValidate(zod(RecoverWithKeySchema)),
		hasRecoveryKey,
		recoveryData: hasRecoveryKey
			? {
					recovery_encrypted_private_key: secretData!.recovery_encrypted_private_key,
					recovery_salt: secretData!.recovery_salt,
					recovery_nonce: secretData!.recovery_nonce
				}
			: null
	};
};

/**
 * Maps known auth error codes to user-friendly messages.
 */
function getPasswordErrorMessage(error: { code?: string; message: string }): string {
	if (error.code === 'same_password') {
		return 'New password must be different from your current password.';
	}
	return `Failed to set password: ${error.message}`;
}

export const actions = {
	/**
	 * Fresh reset: Generate a new key pair (used when user has no recovery key).
	 * Old user_secret is deleted and replaced with new keys.
	 */
	resetFresh: async ({ request, locals: { supabase, safeGetSession } }) => {
		const form = await superValidate(request, zod(ResetPasswordSchema));
		if (!form.valid) return fail(400, { resetForm: form });

		const { session } = await safeGetSession();
		if (!session) {
			return message(form, 'Session expired. Please use the reset link again.', { status: 401 });
		}

		// 1. Update auth password
		const { error: passwordError } = await supabase.auth.updateUser({
			password: form.data.new_password
		});

		if (passwordError) {
			console.error('Password update error:', passwordError);
			return message(form, getPasswordErrorMessage(passwordError), { status: 422 });
		}

		// 2. Delete old user_secret (if exists) and insert new one using admin client
		const admin = createAdminClient();

		// Delete old secret
		const { error: deleteError } = await admin
			.schema('api')
			.from('user_secrets')
			.delete()
			.eq('user_id', session.user.id);

		if (deleteError) {
			console.error('Delete secret error:', deleteError);
		}

		// Delete old file_dek entries since old private key is gone
		const { error: dekDeleteError } = await admin
			.schema('api')
			.from('file_dek')
			.delete()
			.eq('owner_id', session.user.id);

		if (dekDeleteError) {
			console.error('Delete DEK error:', dekDeleteError);
		}

		// Insert new secret
		const { error: secretError } = await admin
			.schema('api')
			.from('user_secrets')
			.insert({
				user_id: session.user.id,
				encrypted_private_key: form.data.encrypted_private_key,
				public_key: form.data.public_key,
				pk_salt: form.data.pk_salt,
				pk_nonce: form.data.pk_nonce,
				recovery_encrypted_private_key: form.data.recovery_encrypted_private_key || null,
				recovery_salt: form.data.recovery_salt || null,
				recovery_nonce: form.data.recovery_nonce || null
			});

		if (secretError) {
			console.error('Secret insert error:', secretError);
			return message(
				form,
				`Password was reset but key setup failed: ${secretError.message}. Please contact an administrator.`,
				{ status: 500 }
			);
		}

		redirect(303, '/dashboard');
	},

	/**
	 * Recovery key reset: Use recovery key to decrypt private key and re-wrap
	 * with new password. Preserves the original private key so all file access remains.
	 */
	recoverWithKey: async ({ request, locals: { supabase, safeGetSession } }) => {
		const form = await superValidate(request, zod(RecoverWithKeySchema));
		if (!form.valid) return fail(400, { recoverForm: form });

		const { session } = await safeGetSession();
		if (!session) {
			return message(form, 'Session expired. Please use the reset link again.', { status: 401 });
		}

		// 1. Update auth password
		const { error: passwordError } = await supabase.auth.updateUser({
			password: form.data.new_password
		});

		if (passwordError) {
			console.error('Password update error:', passwordError);
			return message(form, getPasswordErrorMessage(passwordError), { status: 422 });
		}

		// 2. Update user_secret with new password-encrypted key and new recovery key
		const admin = createAdminClient();
		const { error: updateError } = await admin
			.schema('api')
			.from('user_secrets')
			.update({
				encrypted_private_key: form.data.encrypted_private_key,
				pk_salt: form.data.pk_salt,
				pk_nonce: form.data.pk_nonce,
				recovery_encrypted_private_key: form.data.recovery_encrypted_private_key,
				recovery_salt: form.data.recovery_salt,
				recovery_nonce: form.data.recovery_nonce
			})
			.eq('user_id', session.user.id);

		if (updateError) {
			console.error('Secret update error:', updateError);
			return message(
				form,
				`Password was reset but key re-encryption failed: ${updateError.message}. Please contact an administrator.`,
				{ status: 500 }
			);
		}

		redirect(303, '/dashboard');
	}
} satisfies Actions;
