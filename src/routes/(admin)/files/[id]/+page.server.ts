import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import {
	ClientProfileSchema,
	FileMetadataSchema,
	IpApplicationSchema
} from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:client-files');

	if (!supabase)
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const clientId = params.id;

	const { data: clientData, error: clientError } = await supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at'
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
		.select('*')
		.eq('client_id', clientId)
		.order('created_at', { ascending: false });

	const applicationsParsed = z.array(IpApplicationSchema).safeParse(applicationsData);

	if (appsError) {
		console.error('Error fetching applications:', appsError);
		return {
			client: clientParsed.data,
			applications: [],
			files: [],
			error: 'Failed to load applications.'
		};
	}

	const applicationNumbers = (applicationsData ?? []).map(
		(a: { application_number: string }) => a.application_number
	);

	let filesData: unknown[] = [];
	if (applicationNumbers.length > 0) {
		const { data: fData, error: filesError } = await supabase
			.schema('api')
			.from('file_metadata')
			.select(
				'file_id, uploader_id, file_name, file_path, file_hash, uploaded_at, size, status, category, application_number, file_ledger(block_id, sequence, signature, previous_block), user_profiles(first_name, last_name)'
			)
			.in('application_number', applicationNumbers)
			.order('uploaded_at', { ascending: false });
		if (filesError) {
			console.error('Error fetching files:', filesError);
			return {
				client: clientParsed.data,
				applications: applicationsParsed.success ? applicationsParsed.data : [],
				files: [],
				error: 'Failed to load files.'
			};
		}
		filesData = fData ?? [];
	}

	const filesParsed = z.array(FileMetadataSchema).safeParse(filesData);

	return {
		client: clientParsed.data,
		applications: applicationsParsed.success ? applicationsParsed.data : [],
		files: filesParsed.success ? filesParsed.data : [],
		error: null
	};
}) satisfies PageServerLoad;
