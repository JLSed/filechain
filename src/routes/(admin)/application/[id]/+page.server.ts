import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	IpApplicationSchema,
	FileMetadataSchema,
	TypeOfInventionSchema,
	PreProtectionStatusSchema,
	TypeOfOfficeActionSchema
} from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:application-detail');

	if (!supabase)
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const applicationNumber = params.id;

	// Fetch the application with joins (include id for dropdowns)
	const [appResult, filesResult, inventionTypesResult, protectionStatusesResult, officeActionsResult] =
		await Promise.all([
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
				.eq('application_number', applicationNumber)
				.single(),

			supabase
				.schema('api')
				.from('file_metadata')
				.select(
					'file_id, uploader_id, file_name, file_path, file_hash, uploaded_at, size, status, category, application_number, file_ledger(block_id, sequence, signature, previous_block), user_profiles(first_name, last_name)'
				)
				.eq('application_number', applicationNumber)
				.order('uploaded_at', { ascending: false }),

			supabase.schema('api').from('type_of_invention').select('id, name'),
			supabase.schema('api').from('pre_protection_status').select('id, name'),
			supabase.schema('api').from('type_of_office_action').select('id, name')
		]);

	if (appResult.error || !appResult.data) {
		throw error(404, 'Application not found.');
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
			error: 'Failed to load files.'
		};
	}

	return {
		application: appParsed.data,
		files: filesParsed.success ? filesParsed.data : [],
		inventionTypes: z.array(TypeOfInventionSchema).parse(inventionTypesResult.data ?? []),
		protectionStatuses: z
			.array(PreProtectionStatusSchema)
			.parse(protectionStatusesResult.data ?? []),
		officeActions: z.array(TypeOfOfficeActionSchema).parse(officeActionsResult.data ?? []),
		error: null
	};
}) satisfies PageServerLoad;
