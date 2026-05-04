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
import { fetchRolePermissions, hasPermission } from '$lib/services/permissions';

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

		const perms = await fetchRolePermissions(supabase, currentProfile?.role);
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
		const perms = await fetchRolePermissions(supabase, currentUserData?.role);
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

		// Audit log for adding a new account
		const { session } = await safeGetSession();
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
