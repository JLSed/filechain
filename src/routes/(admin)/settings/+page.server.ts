import type { Actions, PageServerLoad } from './$types';
import { ChangePasswordSchema } from '$lib/types/FormTypes';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 as zod } from 'sveltekit-superforms/adapters';
import { fail, redirect, error } from '@sveltejs/kit';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) {
		redirect(303, '/login');
	}

	const { data: userSecret, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('encrypted_private_key, pk_salt, pk_nonce')
		.eq('user_id', session.user.id)
		.maybeSingle();

	if (secretError) {
		console.error('Failed to fetch user secret for settings:', secretError);
		throw error(500, 'Unable to load account security settings.');
	}

	return {
		form: await superValidate(zod(ChangePasswordSchema)),
		userSecret
	};
}) satisfies PageServerLoad;

export const actions = {
	changePassword: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const form = await superValidate(request, zod(ChangePasswordSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const { session } = await safeGetSession();
		if (!session) {
			return message(form, 'Your session has expired. Please log in again.', { status: 401 });
		}

		if (!session.user.email) {
			return message(form, 'Unable to verify your current password for this account.', {
				status: 400
			});
		}

		const { error: verifyError } = await supabase.auth.signInWithPassword({
			email: session.user.email,
			password: form.data.current_password
		});

		if (verifyError) {
			return message(form, 'Current password is incorrect.', { status: 400 });
		}

		const { error: updatePasswordError } = await supabase.auth.updateUser({
			password: form.data.new_password
		});

		if (updatePasswordError) {
			console.error('Failed to update auth password:', updatePasswordError);
			return message(form, `Failed to update password: ${updatePasswordError.message}`, {
				status: 500
			});
		}

		const { error: updateSecretError } = await supabase
			.schema('api')
			.from('user_secrets')
			.update({
				encrypted_private_key: form.data.encrypted_private_key,
				pk_salt: form.data.pk_salt,
				pk_nonce: form.data.pk_nonce
			})
			.eq('user_id', session.user.id);

		if (updateSecretError) {
			console.error('Failed to update user secret after password change:', updateSecretError);
			return message(
				form,
				`Password updated, but key re-wrap save failed: ${updateSecretError.message}`,
				{
					status: 500
				}
			);
		}

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} Changed Password`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Changed Password'
		});

		return message(form, 'Password changed successfully. Click OK to continue.');
	},

	confirmLogout: async ({ locals: { supabase } }) => {
		const { error: signOutError } = await supabase.auth.signOut();
		if (signOutError) {
			console.error('Failed to sign out after password change confirmation:', signOutError);
			return fail(500, { message: `Sign out failed: ${signOutError.message}` });
		}

		redirect(303, '/login');
	}
} satisfies Actions;
