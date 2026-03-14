import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { ClientProfileSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:client-profiles');
	if (!supabase)
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');

	const { data, error: dbError } = await supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at'
		);

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
