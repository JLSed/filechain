import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';
import { AddUserFormSchema } from '$lib/types/FormTypes';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import z from 'zod';
import { createAdminClient } from '$lib/services/supabase/admin';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';
import { fetchUserPermissions, hasPermission } from '$lib/services/permissions';

// TODO: refresh button on page does not fetch data in database

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:user-profiles');
	const { data, error: dbError } = await supabase.schema('api').from('user_profiles').select('*');

	if (dbError) {
		console.error('Database error:', dbError);
		return {
			users: [],
			availableRoles: [] as string[],
			error:
				'We encountered an error while fetching data. The server might be temporarily unavailable. Please refresh the page.',
			form: await superValidate(zod4(AddUserFormSchema))
		};
	}

	const cleanData = z.array(UserProfileSchema).safeParse(data);
	if (!cleanData.success) {
		console.error('Validation error:', cleanData.error.flatten());
		return {
			users: [],
			availableRoles: [] as string[],
			error: 'The data received is invalid or corrupted.',
			form: await superValidate(zod4(AddUserFormSchema))
		};
	}

	// Fetch available roles from database (includes custom roles)
	const { data: rolesData } = await supabase
		.schema('api')
		.from('roles')
		.select('name')
		.order('name');

	const availableRoles = (rolesData ?? []).map((r: { name: string }) => r.name);

	return {
		users: cleanData.data,
		availableRoles,
		error: null,
		form: await superValidate(zod4(AddUserFormSchema))
	};
}) satisfies PageServerLoad;

export const actions = {
	resetUserPassword: async ({
		request,
		url,
		locals: { supabase, safeGetSession },
		getClientAddress
	}) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		// Permission check
		const { data: currentProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, currentProfile?.role);
		if (!hasPermission(perms, 'users.reset_password')) {
			return fail(403, { error: 'You do not have permission to reset user passwords.' });
		}

		const formData = await request.formData();
		const userId = formData.get('user_id')?.toString();
		if (!userId) return fail(400, { error: 'User ID is required.' });

		// Get target user's email for the reset link
		const admin = createAdminClient();

		const {
			data: { user: targetUser },
			error: getUserError
		} = await admin.auth.admin.getUserById(userId);

		if (getUserError || !targetUser?.email) {
			console.error('Failed to get user for password reset:', getUserError);
			return fail(500, { error: 'Failed to find user account.' });
		}

		// Send password reset email using the SSR supabase client (PKCE flow)
		// The admin client uses the implicit flow (hash fragments) which the
		// server-side /auth/confirm endpoint cannot read.
		const redirectTo = `${url.origin}/auth/confirm?type=recovery`;
		const { error: resetError } = await supabase.auth.resetPasswordForEmail(targetUser.email, {
			redirectTo
		});

		if (resetError) {
			console.error('Failed to send reset email:', resetError);
			return fail(500, { error: `Failed to send reset email: ${resetError.message}` });
		}

		// Delete encryption keys using admin client (bypasses RLS)
		const { error: dekDeleteError } = await admin
			.schema('api')
			.from('file_dek')
			.delete()
			.eq('owner_id', userId);
		if (dekDeleteError) {
			console.error('Failed to delete file DEKs:', dekDeleteError);
		}

		const { error: secretDeleteError } = await admin
			.schema('api')
			.from('user_secrets')
			.delete()
			.eq('user_id', userId);
		if (secretDeleteError) {
			console.error('Failed to delete user secret:', secretDeleteError);
		}

		// Get target user name for audit log
		const { data: targetProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', userId)
			.single();

		const actorName = currentProfile
			? formatName(
					currentProfile.first_name ?? '',
					currentProfile.middle_name,
					currentProfile.last_name ?? ''
				)
			: (session.user.email ?? 'Unknown');

		const targetName = targetProfile
			? formatName(
					targetProfile.first_name ?? '',
					targetProfile.middle_name,
					targetProfile.last_name ?? ''
				)
			: targetUser.email;

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} reset password and encryption keys for ${targetName}`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Password Reset'
		});

		return { success: true };
	},

	archiveUser: async ({ request, locals: { supabase, safeGetSession } }) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		// Permission check
		const { data: currentProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, currentProfile?.role);
		if (!hasPermission(perms, 'users.archive')) {
			return fail(403, { error: 'You do not have permission to archive users.' });
		}

		const formData = await request.formData();
		const userId = formData.get('user_id')?.toString();

		if (!userId) return fail(400, { error: 'User ID is required.' });

		const { error: dbError } = await supabase
			.schema('api')
			.from('user_profiles')
			.update({ is_active: false })
			.eq('user_id', userId);

		if (dbError) {
			console.error('Archive error:', dbError);
			return fail(500, { error: 'Failed to archive user.' });
		}

		return { success: true };
	},

	editRole: async ({ request, locals: { supabase, safeGetSession } }) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const formData = await request.formData();
		const userId = formData.get('user_id')?.toString();
		const role = formData.get('role')?.toString();

		if (!userId || !role) return fail(400, { error: 'User ID and role are required.' });

		// Check permissions: A User Admin cannot change the role of a System Admin,
		// nor can they assign the System Admin role.
		const { data: currentUserData } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role')
			.eq('user_id', session.user.id)
			.single();

		// Permission check
		const perms = await fetchUserPermissions(supabase, session.user.id, currentUserData?.role);
		if (!hasPermission(perms, 'users.edit')) {
			return fail(403, { error: 'You do not have permission to edit user roles.' });
		}

		if (currentUserData?.role !== 'System Admin') {
			const { data: targetUserData } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('role')
				.eq('user_id', userId)
				.single();

			if (targetUserData?.role === 'System Admin') {
				return fail(403, { error: 'You are not authorized to change the role of a System Admin.' });
			}
			if (role === 'System Admin') {
				return fail(403, { error: 'You are not authorized to assign the System Admin role.' });
			}
		}

		const { error: dbError } = await supabase
			.schema('api')
			.from('user_profiles')
			.update({ role })
			.eq('user_id', userId);

		if (dbError) {
			console.error('Edit role error:', dbError);
			return fail(500, { error: 'Failed to update role.' });
		}

		// Reset user's individual permissions to match the new role's defaults
		const admin = createAdminClient();
		if (admin) {
			const { data: rpData } = await admin
				.schema('api')
				.from('role_permissions')
				.select('permission_id')
				.eq('role', role);

			await admin.schema('api').from('user_permissions').delete().eq('user_id', userId);

			if (rpData && rpData.length > 0) {
				const userPermInserts = rpData.map((row: { permission_id: string }) => ({
					user_id: userId,
					permission_id: row.permission_id,
					granted_by: session.user.id
				}));

				const { error: permInsertError } = await admin
					.schema('api')
					.from('user_permissions')
					.insert(userPermInserts);

				if (permInsertError) {
					console.error(
						'Failed to insert user permissions on role preset change:',
						permInsertError
					);
				}
			}
		}

		return { success: true };
	},

	addUser: async ({ request, url, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const form = await superValidate(request, zod4(AddUserFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		const admin = createAdminClient();
		if (!admin) {
			return message(form, 'Server configuration error. Unable to create user.', {
				status: 500
			});
		}

		// Invite the user via email — they will set their own password
		const redirectTo = `${url.origin}/auth/callback`;
		const { data: authData, error: authError } = await admin.auth.admin.inviteUserByEmail(
			form.data.email,
			{ redirectTo }
		);

		if (authError) {
			console.error('Invite error:', authError);
			return message(form, authError.message, { status: 400 });
		}

		// Update the user profile with additional info
		const { error: profileError } = await admin
			.schema('api')
			.from('user_profiles')
			.update({
				first_name: form.data.first_name,
				middle_name: form.data.middle_name || null,
				last_name: form.data.last_name,
				role: form.data.role,
				contact_number: form.data.contact_number || null,
				address: form.data.address || null
			})
			.eq('user_id', authData.user.id);

		if (profileError) {
			console.error('Profile update error:', profileError);
			return message(form, 'User invited but profile update failed. Please edit the user.', {
				status: 500
			});
		}

		// Initialize user's individual permissions from role presets
		const { session } = await safeGetSession();
		const { data: rpData } = await admin
			.schema('api')
			.from('role_permissions')
			.select('permission_id')
			.eq('role', form.data.role);

		if (rpData && rpData.length > 0) {
			const userPermInserts = rpData.map((row: { permission_id: string }) => ({
				user_id: authData.user.id,
				permission_id: row.permission_id,
				granted_by: session?.user?.id || null
			}));

			const { error: permInsertError } = await admin
				.schema('api')
				.from('user_permissions')
				.insert(userPermInserts);

			if (permInsertError) {
				console.error('Failed to initialize user permissions on invite:', permInsertError);
			}
		}

		// Audit log for adding a new account
		if (session) {
			let ipAddress = getClientAddress();
			if (ipAddress === '::1') ipAddress = '127.0.0.1';

			const { data: actorProfile } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('first_name, middle_name, last_name')
				.eq('user_id', session.user.id)
				.single();

			const actorName = actorProfile
				? formatName(
						actorProfile.first_name ?? '',
						actorProfile.middle_name,
						actorProfile.last_name ?? ''
					)
				: (session.user.email ?? 'Unknown');

			const newUserName = formatName(
				form.data.first_name,
				form.data.middle_name || null,
				form.data.last_name
			);

			await insertAuditLog(supabase, {
				actorId: session.user.id,
				details: `${actorName} added new account for ${newUserName} (${form.data.email})`,
				severityLevel: 'notice',
				ipAddress,
				eventType: 'Added Account'
			});
		}

		return { form };
	}
} satisfies Actions;
