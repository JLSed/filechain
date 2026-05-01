import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { supabase }, depends, url }) => {
	depends('db:reports');

	const now = new Date();

	// Parse query params for report period
	const selectedMonth = parseInt(url.searchParams.get('month') ?? String(now.getMonth()));
	const selectedYear = parseInt(url.searchParams.get('year') ?? String(now.getFullYear()));
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';

	// Determine effective date range
	let rangeStart: string;
	let rangeEnd: string;

	if (dateFrom && dateTo) {
		rangeStart = dateFrom;
		rangeEnd = dateTo;
	} else {
		rangeStart = new Date(Date.UTC(selectedYear, selectedMonth, 1)).toISOString().split('T')[0];
		rangeEnd = new Date(Date.UTC(selectedYear, selectedMonth + 1, 0)).toISOString().split('T')[0];
	}

	// Previous month range (for MoM comparison)
	const prevMonthStart = new Date(Date.UTC(selectedYear, selectedMonth - 1, 1))
		.toISOString()
		.split('T')[0];
	const prevMonthEnd = new Date(Date.UTC(selectedYear, selectedMonth, 0))
		.toISOString()
		.split('T')[0];

	// 6-month trend range
	const trendStart = new Date(Date.UTC(selectedYear, selectedMonth - 5, 1))
		.toISOString()
		.split('T')[0];

	const [
		currentAppsResult,
		prevAppsResult,
		currentPaymentsResult,
		prevPaymentsResult,
		trendAppsResult,
		clientsResult,
		clientFilingsResult,
		companySettingsResult,
		inventionTypesResult
	] = await Promise.all([
		// 1. Current period applications
		supabase
			.schema('api')
			.from('ip_applications')
			.select(
				'application_id, application_number, type_of_invention_id, type_of_invention!left(name), status, filling_date, fees, client_id'
			)
			.gte('filling_date', rangeStart)
			.lte('filling_date', rangeEnd),

		// 2. Previous month applications (for MoM comparison)
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_id, type_of_invention_id, type_of_invention!left(name), fees')
			.gte('filling_date', prevMonthStart)
			.lte('filling_date', prevMonthEnd),

		// 3. Current period payments (revenue)
		supabase
			.schema('api')
			.from('invoice_payments')
			.select('payment_id, amount, ewt_amount, payment_date, invoice_id')
			.gte('payment_date', rangeStart)
			.lte('payment_date', rangeEnd),

		// 4. Previous month payments
		supabase
			.schema('api')
			.from('invoice_payments')
			.select('amount')
			.gte('payment_date', prevMonthStart)
			.lte('payment_date', prevMonthEnd),

		// 5. 6-month trend (filing counts)
		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_id, filling_date')
			.gte('filling_date', trendStart)
			.lte('filling_date', rangeEnd)
			.order('filling_date', { ascending: true }),

		// 6. All client profiles
		supabase
			.schema('api')
			.from('client_profiles')
			.select(
				'client_id, first_name, middle_name, last_name, is_individual, nationality, company_name, company_address, email, created_at'
			),

		// 7. All applications with client info (for client filing ranking)
		supabase
			.schema('api')
			.from('ip_applications')
			.select(
				'application_id, client_id, client_profiles!left(client_id, first_name, last_name, is_individual, company_name, nationality)'
			),

		// 8. Company settings
		supabase.schema('api').from('company_settings').select('*').single(),

		// 9. Invention types
		supabase.schema('api').from('type_of_invention').select('id, name')
	]);

	// Compute 6-month trend data
	const trendData: { month: string; count: number }[] = [];
	for (let i = 5; i >= 0; i--) {
		const m = new Date(Date.UTC(selectedYear, selectedMonth - i, 1));
		const monthLabel = m.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
		const mStart = m.toISOString().split('T')[0];
		const mEnd = new Date(Date.UTC(m.getFullYear(), m.getMonth() + 1, 0))
			.toISOString()
			.split('T')[0];
		const count = (trendAppsResult.data ?? []).filter((app) => {
			return app.filling_date && app.filling_date >= mStart && app.filling_date <= mEnd;
		}).length;
		trendData.push({ month: monthLabel, count });
	}

	// Period label
	const periodLabel =
		dateFrom && dateTo
			? `${new Date(dateFrom).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} – ${new Date(dateTo).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
			: new Date(Date.UTC(selectedYear, selectedMonth, 1)).toLocaleDateString('en-US', {
					month: 'long',
					year: 'numeric'
				});

	return {
		currentApplications: currentAppsResult.data ?? [],
		prevApplications: prevAppsResult.data ?? [],
		currentPayments: currentPaymentsResult.data ?? [],
		prevPayments: prevPaymentsResult.data ?? [],
		trendData,
		clients: clientsResult.data ?? [],
		clientFilings: clientFilingsResult.data ?? [],
		companySettings: companySettingsResult.data ?? {
			company_name: 'DMV IP Consultancy',
			contact_info: '',
			registered_address: '',
			tin: ''
		},
		inventionTypes: inventionTypesResult.data ?? [],
		periodLabel,
		selectedMonth,
		selectedYear,
		dateFrom,
		dateTo,
		generatedAt: now.toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		})
	};
}) satisfies PageServerLoad;
