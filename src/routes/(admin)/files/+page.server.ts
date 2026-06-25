import type { PageServerLoad } from './$types';
import { ClientProfileSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';
import { createAdminClient } from '$lib/services/supabase/admin';

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
