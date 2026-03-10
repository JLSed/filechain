import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { IpApplicationSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:ip-applications');
	if (!supabase) return error(400, 'Supabase is not initialized');

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
		throw error(500, 'Failed to fetch IP Applications');
	}

	const cleanData = z.array(IpApplicationSchema).safeParse(data);
	if (!cleanData.success) throw error(500, 'Failed to fetch IP Applications');

	return { applications: cleanData.data };
}) satisfies PageServerLoad;
