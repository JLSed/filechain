import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	ClientProfileSchema,
	FileMetadataSchema,
	IpApplicationSchema
} from '$lib/types/DatabaseTypes';
import z from 'zod';
import { createAdminClient } from '$lib/services/supabase/admin';
import { fetchUserPermissions, hasPermission } from '$lib/services/permissions';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:client-files');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const clientId = params.id;

	const { data: clientData, error: clientError } = await supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, is_individual, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at'
		)
		.eq('client_id', clientId)
		.single();

	if (clientError || !clientData) {
		throw error(404, 'Client not found.');
	}

	const clientParsed = ClientProfileSchema.safeParse(clientData);
	if (!clientParsed.success) {
		throw error(500, 'Invalid client data received.');
	}

	const { data: applicationsData, error: appsError } = await supabase
		.schema('api')
		.from('ip_applications')
		.select(
			`*, 
        client_profiles!left (first_name, last_name, email), 
        type_of_invention!left (name),
        pre_protection_status!left (name),
        type_of_office_action!left (name)`
		)
		.eq('client_id', clientId)
		.order('created_at', { ascending: false });

	const applicationsParsed = z.array(IpApplicationSchema).safeParse(applicationsData);

	if (appsError) {
		console.error('Error fetching applications:', appsError);
		return {
			client: clientParsed.data,
			applications: [],
			files: [],
			accessibleFileIds: [],
			error: 'Failed to load applications.'
		};
	}

	const applicationIds = (applicationsData ?? []).map(
		(a: { application_id: string }) => a.application_id
	);

	let filesData: unknown[] = [];
	if (applicationIds.length > 0) {
		const { data: fData, error: filesError } = await supabase
			.schema('api')
			.from('file_metadata')
			.select(
				'file_id, uploader_id, file_name, file_path, file_hash, uploaded_at, size, status, category, application_id, file_ledger(block_id, sequence, signature, previous_block), user_profiles(first_name, last_name)'
			)
			.in('application_id', applicationIds)
			.order('uploaded_at', { ascending: false });
		if (filesError) {
			console.error('Error fetching files:', filesError);
			return {
				client: clientParsed.data,
				applications: applicationsParsed.success ? applicationsParsed.data : [],
				files: [],
				accessibleFileIds: [],
				error: 'Failed to load files.'
			};
		}
		filesData = fData ?? [];
	}

	const filesParsed = z.array(FileMetadataSchema).safeParse(filesData);

	// Fetch the file IDs the current user has a DEK for (i.e. has access to)
	const { data: dekData } = await supabase
		.schema('api')
		.from('file_dek')
		.select('file_id')
		.eq('owner_id', session.session.user.id);

	const accessibleFileIds = (dekData ?? []).map((d: { file_id: string }) => d.file_id);

	return {
		client: clientParsed.data,
		applications: applicationsParsed.success ? applicationsParsed.data : [],
		files: filesParsed.success ? filesParsed.data : [],
		accessibleFileIds,
		error: null
	};
}) satisfies PageServerLoad;

export const actions = {
	archiveFile: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
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
		if (!hasPermission(perms, 'files.archive')) {
			return fail(403, { error: 'You do not have permission to archive files.' });
		}

		const formData = await request.formData();
		const fileId = formData.get('file_id')?.toString();
		if (!fileId) return fail(400, { error: 'File ID is required.' });

		const now = new Date().toISOString();
		const admin = createAdminClient();

		const { error: fileErr } = await admin
			.schema('api')
			.from('file_metadata')
			.update({ is_archived: true, archived_at: now })
			.eq('file_id', fileId);

		if (fileErr) {
			console.error('Archive file error:', fileErr);
			return fail(500, { error: 'Failed to archive file.' });
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
			details: `${actorName} archived file ${fileId}`,
			severityLevel: 'warning',
			ipAddress,
			eventType: 'Archived File'
		});

		return { success: true };
	}
} satisfies Actions;
