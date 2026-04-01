import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:dashboard');

	const now = new Date();

	// Start of current month (UTC)
	const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
		.toISOString()
		.split('T')[0];
	const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
		.toISOString()
		.split('T')[0];

	// Current week boundaries (Monday–Sunday)
	const dayOfWeek = now.getUTCDay(); // 0=Sun … 6=Sat
	const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const weekStart = new Date(
		Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset)
	)
		.toISOString()
		.split('T')[0];
	const weekEnd = new Date(
		Date.UTC(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset + 6)
	)
		.toISOString()
		.split('T')[0];

	const todayStr = now.toISOString().split('T')[0];

	// All queries run in parallel
	const [
		allAppsResult,
		monthlyAppsResult,
		weeklyDeadlinesResult,
		overdueResult,
		revenueResult,
		inventionTypesResult
	] = await Promise.all([
		// 1. All active applications (exclude Completed status)
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_number, status, type_of_invention_id, type_of_invention!left(name)')
			.neq('status', 'Completed'),

		// 2. Applications filed this month (by filling_date)
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_number, type_of_invention_id, type_of_invention!left(name)')
			.gte('filling_date', monthStart)
			.lte('filling_date', monthEnd),

		// 3. Deadlines this week
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_number, title_of_invention, deadline')
			.gte('deadline', weekStart)
			.lte('deadline', weekEnd)
			.order('deadline', { ascending: true }),

		// 4. Overdue cases (deadline < today, not Completed)
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_number, title_of_invention, deadline, status')
			.lt('deadline', todayStr)
			.neq('status', 'Completed'),

		// 5. Revenue this month — daily sum of fees for apps created this month
		supabase
			.schema('api')
			.from('ip_applications')
			.select('fees, created_at')
			.gte('created_at', `${monthStart}T00:00:00Z`)
			.lte('created_at', `${monthEnd}T23:59:59Z`)
			.not('fees', 'is', null),

		// 6. Invention types for chart config
		supabase.schema('api').from('type_of_invention').select('id, name')
	]);

	return {
		activeApplications: allAppsResult.data ?? [],
		monthlyApplications: monthlyAppsResult.data ?? [],
		weeklyDeadlines: weeklyDeadlinesResult.data ?? [],
		overdueApplications: overdueResult.data ?? [],
		revenueData: revenueResult.data ?? [],
		inventionTypes: inventionTypesResult.data ?? [],
		currentMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
		weekRange: `${new Date(weekStart).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(weekEnd).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
	};
}) satisfies PageServerLoad;
