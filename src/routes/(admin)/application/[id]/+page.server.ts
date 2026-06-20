import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	IpApplicationSchema,
	FileMetadataSchema,
	TypeOfInventionSchema,
	PreProtectionStatusSchema,
	TypeOfOfficeActionSchema
} from '$lib/types/DatabaseTypes';
import z from 'zod';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends, parent }) => {
	depends('db:application-detail');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const { profile } = await parent();
	const isSystemAdmin = profile.role === 'System Admin';

	const idOrNum = params.id;
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	const applicationId = idOrNum;

	if (!uuidRegex.test(idOrNum)) {
		const { data: appData } = await supabase
			.schema('api')
			.from('ip_applications')
			.select('application_id')
			.eq('application_number', idOrNum)
			.maybeSingle();

		if (appData?.application_id) {
			throw redirect(307, `/application/${appData.application_id}`);
		} else {
			throw error(404, 'Application not found.');
		}
	}

	// Fetch the application with joins (include id for dropdowns)
	const [
		appResult,
		filesResult,
		inventionTypesResult,
		protectionStatusesResult,
		officeActionsResult
	] = await Promise.all([
		supabase
			.schema('api')
			.from('ip_applications')
			.select(
				`*, 
				client_profiles!left (first_name, last_name, email), 
				type_of_invention!left (id, name),
				pre_protection_status!left (id, name),
				type_of_office_action!left (id, name)`
			)
			.eq('application_id', applicationId)
			.single(),

		supabase
			.schema('api')
			.from('file_metadata')
			.select(
				'file_id, uploader_id, file_name, file_path, file_hash, uploaded_at, size, status, category, application_id, file_ledger(block_id, sequence, signature, previous_block), user_profiles(first_name, last_name)'
			)
			.eq('application_id', applicationId)
			.order('uploaded_at', { ascending: false }),

		supabase.schema('api').from('type_of_invention').select('id, name'),
		supabase.schema('api').from('pre_protection_status').select('id, name'),
		supabase.schema('api').from('type_of_office_action').select('id, name')
	]);

	if (appResult.error || !appResult.data) {
		throw error(404, 'Application not found.');
	}

	// Enforce team_assigned permission
	if (!isSystemAdmin && appResult.data.team_assigned !== profile.role) {
		throw error(403, 'Forbidden: You do not have permission to view this application.');
	}

	const appParsed = IpApplicationSchema.safeParse(appResult.data);
	if (!appParsed.success) {
		throw error(500, 'Invalid application data received.');
	}

	const filesParsed = z.array(FileMetadataSchema).safeParse(filesResult.data ?? []);

	if (filesResult.error) {
		console.error('Error fetching files:', filesResult.error);
		return {
			application: appParsed.data,
			files: [],
			inventionTypes: z.array(TypeOfInventionSchema).parse(inventionTypesResult.data ?? []),
			protectionStatuses: z
				.array(PreProtectionStatusSchema)
				.parse(protectionStatusesResult.data ?? []),
			officeActions: z.array(TypeOfOfficeActionSchema).parse(officeActionsResult.data ?? []),
			accessibleFileIds: [],
			error: 'Failed to load files.'
		};
	}

	// Fetch the file IDs the current user has a DEK for (i.e. has access to)
	const { data: dekData } = await supabase
		.schema('api')
		.from('file_dek')
		.select('file_id')
		.eq('owner_id', session.session.user.id);

	const accessibleFileIds = (dekData ?? []).map((d: { file_id: string }) => d.file_id);

	return {
		application: appParsed.data,
		files: filesParsed.success ? filesParsed.data : [],
		inventionTypes: z.array(TypeOfInventionSchema).parse(inventionTypesResult.data ?? []),
		protectionStatuses: z
			.array(PreProtectionStatusSchema)
			.parse(protectionStatusesResult.data ?? []),
		officeActions: z.array(TypeOfOfficeActionSchema).parse(officeActionsResult.data ?? []),
		accessibleFileIds,
		error: null
	};
}) satisfies PageServerLoad;

export const actions = {
	saveApplication: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const applicationId = formData.get('application_id') as string;
		const payloadJson = formData.get('payload') as string;
		const changesJson = formData.get('changes') as string | null;

		if (!applicationId || !payloadJson) {
			return fail(400, { message: 'Missing required fields.' });
		}

		let updatePayload: Record<string, unknown>;
		try {
			updatePayload = JSON.parse(payloadJson);
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		// Verify write permission
		const { data: appData, error: checkError } = await supabase
			.schema('api')
			.from('ip_applications')
			.select('team_assigned')
			.eq('application_id', applicationId)
			.maybeSingle();

		if (checkError || !appData) {
			return fail(404, { message: 'Application not found.' });
		}

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.session.user.id)
			.single();

		const isSystemAdmin = profile?.role === 'System Admin';
		if (!isSystemAdmin && appData.team_assigned !== profile?.role) {
			return fail(403, { message: 'You do not have permission to modify this application.' });
		}

		// Perform the database update
		const { error: updateError } = await supabase
			.schema('api')
			.from('ip_applications')
			.update(updatePayload)
			.eq('application_id', applicationId);

		if (updateError) {
			return fail(500, { message: `Failed to save: ${updateError.message}` });
		}

		// Log audit entry with IP address
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.session.user.email ?? 'Unknown');

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
			details: `${actorName} Edited Application ${applicationId}`,
			changes: parsedChanges,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Edited Application'
		});

		return { success: true };
	}
} satisfies Actions;
