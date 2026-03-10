import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { IpApplicationSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:ip-applications');
	if (!supabase)
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');

	const { data, error: dbError } = await supabase
		.schema('api')
		.from('ip_applications')
		.select(
			`*, 
        client_profiles!left (first_name, last_name, email), 
        type_of_invention!left (name),
        pre_protection_status!left (name),
        type_of_office_action!left (name)`
		);

	if (dbError) {
		console.error('Database error:', dbError);
		return {
			applications: [],
			error:
				'We encountered an error while fetching data. The server might be temporarily unavailable. Please refresh the page.'
		};
	}

	const cleanData = z.array(IpApplicationSchema).safeParse(data);
	if (!cleanData.success)
		return { applications: [], error: 'The data received is invalid or corrupted.' };

	return { applications: cleanData.data, error: null };
}) satisfies PageServerLoad;
