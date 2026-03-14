import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';
import { AddUserFormSchema } from '$lib/types/FormTypes';
import { superValidate, message } from 'sveltekit-superforms';
import { zod4 } from 'sveltekit-superforms/adapters';
import z from 'zod';
import { createAdminClient } from '$lib/services/supabase/admin';

// TODO: refresh button on page does not fetch data in database

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:user-profiles');
	if (!supabase)
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');

	const { data, error: dbError } = await supabase.schema('api').from('user_profiles').select('*');

	if (dbError) {
		console.error('Database error:', dbError);
		return {
			users: [],
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
			error: 'The data received is invalid or corrupted.',
			form: await superValidate(zod4(AddUserFormSchema))
		};
	}

	return {
		users: cleanData.data,
		error: null,
		form: await superValidate(zod4(AddUserFormSchema))
	};
}) satisfies PageServerLoad;

export const actions = {
	archiveUser: async ({ request, locals: { supabase } }) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

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

	editRole: async ({ request, locals: { supabase } }) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

		const formData = await request.formData();
		const userId = formData.get('user_id')?.toString();
		const role = formData.get('role')?.toString();

		if (!userId || !role) return fail(400, { error: 'User ID and role are required.' });

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

	addUser: async ({ request, url }) => {
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

		return { form };
	}
} satisfies Actions;
