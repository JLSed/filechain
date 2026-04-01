import type { PageServerLoad } from './$types';
import { IpApplicationSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends, parent }) => {
	depends('db:ip-applications');
	const { profile } = await parent();
	const isSystemAdmin = profile.role === 'System Admin';

	let appQuery = supabase
		.schema('api')
		.from('ip_applications')
		.select(
			`*, 
        client_profiles!left (first_name, last_name, email), 
        type_of_invention!left (name),
        pre_protection_status!left (name),
        type_of_office_action!left (name)`
		);

	if (!isSystemAdmin && profile.role) {
		appQuery = appQuery.eq('team_assigned', profile.role);
	}

	const { data, error: dbError } = await appQuery;

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
