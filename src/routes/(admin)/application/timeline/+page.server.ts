import type { PageServerLoad } from './$types';
import { IpApplicationSchema, ApplicationTaskSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

export const load = (async ({ locals: { supabase }, depends, parent }) => {
	depends('db:timeline');

	const { profile } = await parent();
	const isSystemAdmin = profile.role === 'System Admin';

	// Fetch applications (filtered by team if not system admin)
	let appQuery = supabase
		.schema('api')
		.from('ip_applications')
		.select(
			`*, 
			client_profiles!left (first_name, last_name, email),
			type_of_invention!left (name)`
		)
		.order('created_at', { ascending: false });

	if (!isSystemAdmin && profile.role) {
		appQuery = appQuery.eq('team_assigned', profile.role);
	}

	const { data: appData, error: appError } = await appQuery;

	if (appError) {
		console.error('Database error fetching applications:', appError);
		return { applications: [], tasks: [], error: 'Failed to load applications.' };
	}

	const appsParsed = z.array(IpApplicationSchema).safeParse(appData);
	if (!appsParsed.success) {
		console.error('Application parse error:', appsParsed.error.flatten());
		return { applications: [], tasks: [], error: 'Invalid application data received.' };
	}

	// Fetch tasks for all visible applications
	const appIds = appsParsed.data.map((a) => a.application_id);

	let tasks: z.infer<typeof ApplicationTaskSchema>[] = [];

	if (appIds.length > 0) {
		const { data: taskData, error: taskError } = await supabase
			.schema('api')
			.from('application_tasks')
			.select('*')
			.in('application_id', appIds)
			.order('created_at', { ascending: true });

		if (taskError) {
			console.error('Database error fetching tasks:', taskError);
		} else {
			const tasksParsed = z.array(ApplicationTaskSchema).safeParse(taskData);
			if (tasksParsed.success) {
				tasks = tasksParsed.data;
			}
		}
	}

	return { applications: appsParsed.data, tasks, error: null };
}) satisfies PageServerLoad;
