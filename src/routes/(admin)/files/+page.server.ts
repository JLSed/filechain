import type { PageServerLoad } from './$types';
import { ClientProfileSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

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

	// If non-admin has no matching applications, return empty immediately
	if (clientIds !== null && clientIds.length === 0) {
		return { clients: [], error: null };
	}

	let clientQuery = supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at'
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
				'We encountered an error while fetching data. The server might be temporarily unavailable. Please refresh the page.'
		};
	}

	const cleanData = z.array(ClientProfileSchema).safeParse(data);
	if (!cleanData.success)
		return { clients: [], error: 'The data received is invalid or corrupted.' };

	return { clients: cleanData.data, error: null };
}) satisfies PageServerLoad;
