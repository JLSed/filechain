import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { AuditLogSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:audit-logs');

	if (!supabase) {
		throw error(500, 'A server configuration error occurred. Unable to connect to the database.');
	}

	const { data, error: dbError } = await supabase
		.schema('api')
		.from('audit_logs')
		.select('*')
		.order('timestamp', { ascending: false });

	if (dbError) {
		console.error('Database error:', dbError);
		return {
			logs: [],
			error:
				'We encountered an error while fetching audit logs. The server might be temporarily unavailable. Please refresh the page.'
		};
	}

	const cleanData = z.array(AuditLogSchema).safeParse(data);

	if (!cleanData.success) {
		console.error('Validation error:', cleanData.error.flatten());
		return {
			logs: [],
			error: 'The data received is invalid or corrupted.'
		};
	}

	return {
		logs: cleanData.data,
		error: null
	};
}) satisfies PageServerLoad;
