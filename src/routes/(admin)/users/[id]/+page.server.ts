import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { UserProfileSchema } from '$lib/types/DatabaseTypes';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';
import { fetchRolePermissions, hasPermission } from '$lib/services/permissions';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:user-detail');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const userId = params.id;

	const { data, error: dbError } = await supabase
		.schema('api')
		.from('user_profiles')
		.select('*')
		.eq('user_id', userId)
		.single();

	if (dbError || !data) {
		throw error(404, 'User not found.');
	}

	const parsed = UserProfileSchema.safeParse(data);
	if (!parsed.success) {
		throw error(500, 'Invalid user data received.');
	}

	// Fetch available roles
	const { data: rolesData } = await supabase
		.schema('api')
		.from('roles')
		.select('name')
		.order('name');

	const availableRoles = (rolesData ?? []).map((r: { name: string }) => r.name);

	return {
		user: parsed.data,
		availableRoles
	};
}) satisfies PageServerLoad;

export const actions = {
	saveUser: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const userId = formData.get('user_id') as string;
		const payloadJson = formData.get('payload') as string;
		const changesJson = formData.get('changes') as string | null;

		if (!userId || !payloadJson) {
			return fail(400, { message: 'Missing required fields.' });
		}

		let updatePayload: Record<string, unknown>;
		try {
			updatePayload = JSON.parse(payloadJson);
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		// Perform the database update
		const { error: updateError } = await supabase
			.schema('api')
			.from('user_profiles')
			.update(updatePayload)
			.eq('user_id', userId);

		if (updateError) {
			return fail(500, { message: `Failed to save: ${updateError.message}` });
		}

		// Log audit entry with IP address
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.session.user.id)
			.single();

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.session.user.email ?? 'Unknown');

		// Get the target user's name for the log
		const { data: targetProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', userId)
			.single();

		const targetName = targetProfile
			? formatName(
					targetProfile.first_name ?? '',
					targetProfile.middle_name,
					targetProfile.last_name ?? ''
				)
			: userId;

		let parsedChanges: Record<string, { old: unknown; new: unknown }> | null = null;
		if (changesJson) {
			try {
				parsedChanges = JSON.parse(changesJson);
			} catch {
				// Ignore parse errors for changes — still save the update
			}
		}

		await insertAuditLog(supabase, {
			actorId: session.session.user.id,
			details: `${actorName} Edited Account ${targetName}`,
			changes: parsedChanges,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Edited Account'
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
	}
} satisfies Actions;
