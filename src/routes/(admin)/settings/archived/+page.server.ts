import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createAdminClient } from '$lib/services/supabase/admin';
import { fetchUserPermissions, hasPermission } from '$lib/services/permissions';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ locals: { safeGetSession }, depends }) => {
	depends('db:archived-items');

	const { session } = await safeGetSession();
	if (!session) throw error(401, 'Unauthorized');

	const admin = createAdminClient();

	const [clientsResult, appsResult, filesResult] = await Promise.all([
		admin.schema('api').from('archived_client_profiles').select('*'),
		admin.schema('api').from('archived_ip_applications').select('*'),
		admin.schema('api').from('archived_file_metadata').select('*')
	]);

	return {
		archivedClients: clientsResult.data ?? [],
		archivedApplications: appsResult.data ?? [],
		archivedFiles: filesResult.data ?? []
	};
}) satisfies PageServerLoad;

export const actions = {
	restoreClient: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, profile?.role);
		if (!hasPermission(perms, 'clients.archive')) {
			return fail(403, { error: 'You do not have permission to restore clients.' });
		}

		const formData = await request.formData();
		const clientId = formData.get('client_id')?.toString();
		if (!clientId) return fail(400, { error: 'Client ID is required.' });

		const admin = createAdminClient();

		// Cascading restore: client → applications → files
		await admin
			.schema('api')
			.from('archived_client_profiles')
			.update({ is_archived: false, archived_at: null })
			.eq('client_id', clientId);

		const { data: apps } = await admin
			.schema('api')
			.from('archived_ip_applications')
			.select('application_id')
			.eq('client_id', clientId);

		await admin
			.schema('api')
			.from('archived_ip_applications')
			.update({ is_archived: false, archived_at: null })
			.eq('client_id', clientId);

		if (apps && apps.length > 0) {
			const appIds = apps.map((a: { application_id: string }) => a.application_id);
			await admin
				.schema('api')
				.from('archived_file_metadata')
				.update({ is_archived: false, archived_at: null })
				.in('application_id', appIds);
		}

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} restored client ${clientId}`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Restored Client'
		});

		return { success: true };
	},

	restoreApplication: async ({
		request,
		locals: { supabase, safeGetSession },
		getClientAddress
	}) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, profile?.role);
		if (!hasPermission(perms, 'applications.archive')) {
			return fail(403, { error: 'You do not have permission to restore applications.' });
		}

		const formData = await request.formData();
		const applicationId = formData.get('application_id')?.toString();
		if (!applicationId) return fail(400, { error: 'Application ID is required.' });

		const admin = createAdminClient();

		// Fetch the application to check its client_id
		const { data: appData, error: fetchAppErr } = await admin
			.schema('api')
			.from('archived_ip_applications')
			.select('client_id')
			.eq('application_id', applicationId)
			.maybeSingle();

		if (fetchAppErr || !appData) {
			return fail(404, { error: 'Application not found or already active.' });
		}

		// Verify client status: active vs archived vs non-existent
		const [activeClient, archivedClient] = await Promise.all([
			admin
				.schema('api')
				.from('client_profiles')
				.select('client_id')
				.eq('client_id', appData.client_id)
				.maybeSingle(),
			admin
				.schema('api')
				.from('archived_client_profiles')
				.select('client_id')
				.eq('client_id', appData.client_id)
				.maybeSingle()
		]);

		if (archivedClient.data) {
			return fail(400, {
				error:
					'Cannot restore application because its parent client profile is currently archived. Please restore the client first.'
			});
		}

		if (!activeClient.data) {
			return fail(404, {
				error: 'Cannot restore application because its parent client profile no longer exists.'
			});
		}

		await admin
			.schema('api')
			.from('archived_ip_applications')
			.update({ is_archived: false, archived_at: null })
			.eq('application_id', applicationId);

		// Cascade restore files
		await admin
			.schema('api')
			.from('archived_file_metadata')
			.update({ is_archived: false, archived_at: null })
			.eq('application_id', applicationId);

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} restored application ${applicationId}`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Restored Application'
		});

		return { success: true };
	},

	restoreFile: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Unauthorized.' });

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const perms = await fetchUserPermissions(supabase, session.user.id, profile?.role);
		if (!hasPermission(perms, 'files.archive')) {
			return fail(403, { error: 'You do not have permission to restore files.' });
		}

		const formData = await request.formData();
		const fileId = formData.get('file_id')?.toString();
		if (!fileId) return fail(400, { error: 'File ID is required.' });

		const admin = createAdminClient();

		// Fetch the file to check its application_id
		const { data: fileData, error: fetchFileErr } = await admin
			.schema('api')
			.from('archived_file_metadata')
			.select('application_id')
			.eq('file_id', fileId)
			.maybeSingle();

		if (fetchFileErr || !fileData) {
			return fail(404, { error: 'File not found or already active.' });
		}

		if (fileData.application_id) {
			// Verify application status: active vs archived vs non-existent
			const [activeApp, archivedApp] = await Promise.all([
				admin
					.schema('api')
					.from('ip_applications')
					.select('application_id')
					.eq('application_id', fileData.application_id)
					.maybeSingle(),
				admin
					.schema('api')
					.from('archived_ip_applications')
					.select('application_id')
					.eq('application_id', fileData.application_id)
					.maybeSingle()
			]);

			if (archivedApp.data) {
				return fail(400, {
					error:
						'Cannot restore file because its parent application is currently archived. Please restore the application first.'
				});
			}

			if (!activeApp.data) {
				return fail(404, {
					error: 'Cannot restore file because its parent application no longer exists.'
				});
			}
		}

		await admin
			.schema('api')
			.from('archived_file_metadata')
			.update({ is_archived: false, archived_at: null })
			.eq('file_id', fileId);

		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} restored file ${fileId}`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Restored File'
		});

		return { success: true };
	}
} satisfies Actions;
