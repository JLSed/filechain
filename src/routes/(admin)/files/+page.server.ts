import type { PageServerLoad, Actions } from './$types';
import { ClientProfileSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';
import { createAdminClient } from '$lib/services/supabase/admin';
import { error, fail } from '@sveltejs/kit';
import { fetchUserPermissions, hasPermission } from '$lib/services/permissions';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

// Extend schema to validate team assignments fetched via relations
const ClientProfileWithAppsSchema = ClientProfileSchema.extend({
	ip_applications: z
		.array(
			z.object({
				team_assigned: z.string().nullable()
			})
		)
		.optional()
		.default([])
});

export const load = (async ({ locals: { supabase }, depends, parent }) => {
	depends('db:client-profiles');
	const { profile } = await parent();
	const isSystemAdmin = profile.role === 'System Admin';

	// For non-System Admin users, only show clients that have an application
	// where team_assigned matches the user's role
	let clientIds: string[] | null = null;
	if (!isSystemAdmin && profile.role) {
		const { data: apps } = await supabase
			.schema('api')
			.from('ip_applications')
			.select('client_id')
			.eq('team_assigned', profile.role);

		clientIds = [...new Set((apps ?? []).map((a: { client_id: string }) => a.client_id))];
	}

	// Fetch storage metrics using the admin client
	const adminClient = createAdminClient();
	const { data: metricsData } = await adminClient.schema('api').rpc('get_storage_metrics');
	const storageSizeBytes = metricsData?.storage_size_bytes ?? 0;
	const totalFilesCount = metricsData?.total_files_count ?? 0;

	// If non-admin has no matching applications, return empty immediately
	if (clientIds !== null && clientIds.length === 0) {
		return { clients: [], error: null, storageSizeBytes, totalFilesCount };
	}

	let clientQuery = supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, is_individual, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at, ip_applications(team_assigned)'
		);

	if (clientIds !== null) {
		clientQuery = clientQuery.in('client_id', clientIds);
	}

	const { data, error: dbError } = await clientQuery;

	if (dbError) {
		console.error('Database error:', dbError);
		return {
			clients: [],
			error:
				'We encountered an error while fetching data. The server might be temporarily unavailable. Please refresh the page.',
			storageSizeBytes,
			totalFilesCount
		};
	}

	const cleanData = z.array(ClientProfileWithAppsSchema).safeParse(data);
	if (!cleanData.success) {
		console.error('Parse error:', cleanData.error.flatten());
		return {
			clients: [],
			error: 'The data received is invalid or corrupted.',
			storageSizeBytes,
			totalFilesCount
		};
	}

	return { clients: cleanData.data, error: null, storageSizeBytes, totalFilesCount };
}) satisfies PageServerLoad;

export const actions = {
	archiveClient: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		if (!supabase) throw error(500, 'Unable to connect to the database.');

		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const { data: currentProfile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, currentProfile?.role);
		if (!hasPermission(perms, 'clients.archive')) {
			return fail(403, { error: 'You do not have permission to archive clients.' });
		}

		const formData = await request.formData();
		const clientId = formData.get('client_id')?.toString();
		if (!clientId) return fail(400, { error: 'Client ID is required.' });

		const now = new Date().toISOString();
		const admin = createAdminClient();

		// Cascade: archive the client, their applications, and their files
		const { error: clientErr } = await admin
			.schema('api')
			.from('client_profiles')
			.update({ is_archived: true, archived_at: now })
			.eq('client_id', clientId);

		if (clientErr) {
			console.error('Archive client error:', clientErr);
			return fail(500, { error: 'Failed to archive client.' });
		}

		const { data: apps } = await admin
			.schema('api')
			.from('ip_applications')
			.select('application_id')
			.eq('client_id', clientId);

		await admin
			.schema('api')
			.from('ip_applications')
			.update({ is_archived: true, archived_at: now })
			.eq('client_id', clientId);

		if (apps && apps.length > 0) {
			const appIds = apps.map((a: { application_id: string }) => a.application_id);
			await admin
				.schema('api')
				.from('file_metadata')
				.update({ is_archived: true, archived_at: now })
				.in('application_id', appIds);
		}

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = currentProfile
			? formatName(
					currentProfile.first_name ?? '',
					currentProfile.middle_name,
					currentProfile.last_name ?? ''
				)
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} archived client ${clientId}`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Archived Client'
		});

		return { success: true };
	}
} satisfies Actions;
