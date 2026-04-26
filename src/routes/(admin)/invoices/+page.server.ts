import type { PageServerLoad } from './$types';
import { InvoiceSchema } from '$lib/types/DatabaseTypes';
import z from 'zod';

/** Lightweight schema for the monthly payment stats query (only selects amount + payment_date). */
const PaymentStatSchema = z.object({
	amount: z.coerce.number(),
	payment_date: z.string()
});

export const load = (async ({ locals: { supabase }, depends }) => {
	depends('db:invoices');

	const now = new Date();

	// Current month boundaries
	const monthStart = new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1))
		.toISOString()
		.split('T')[0];
	const monthEnd = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 0))
		.toISOString()
		.split('T')[0];

	const [invoicesResult, monthlyStatsResult] = await Promise.all([
		// All invoices with client + application joins
		supabase
			.schema('api')
			.from('invoices')
			.select(
				`*,
				client_profiles!left(first_name, last_name, company_name, is_individual, tin),
				ip_applications!left(title_of_invention, application_number)`
			)
			.order('created_at', { ascending: false }),

		// Revenue stats for current month (paid amounts)
		supabase
			.schema('api')
			.from('invoice_payments')
			.select('amount, payment_date')
			.gte('payment_date', monthStart)
			.lte('payment_date', monthEnd)
	]);

	if (invoicesResult.error) {
		console.error('Database error fetching invoices:', invoicesResult.error);
		return {
			invoices: [],
			stats: {
				totalOutstanding: 0,
				revenueThisMonth: 0,
				invoicesSentThisMonth: 0,
				overdueCount: 0
			},
			currentMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
			error: 'Failed to load invoices. Please refresh the page.'
		};
	}

	const invoicesParsed = z.array(InvoiceSchema).safeParse(invoicesResult.data);
	if (!invoicesParsed.success) {
		console.error('Invoice parse error:', invoicesParsed.error.flatten());
		return {
			invoices: [],
			stats: {
				totalOutstanding: 0,
				revenueThisMonth: 0,
				invoicesSentThisMonth: 0,
				overdueCount: 0
			},
			currentMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
			error: 'Invalid invoice data received.'
		};
	}

	const paymentsParsed = z.array(PaymentStatSchema).safeParse(monthlyStatsResult.data ?? []);
	const payments = paymentsParsed.success ? paymentsParsed.data : [];

	if (!paymentsParsed.success) {
		console.error('Payment stats parse error:', paymentsParsed.error.flatten());
	}

	// Compute summary stats from validated invoices
	const invoices = invoicesParsed.data;

	const totalOutstanding = invoices
		.filter((inv) => !['Paid', 'Cancelled'].includes(inv.status))
		.reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid - inv.ewt_amount), 0);

	const revenueThisMonth = payments.reduce((sum, p) => sum + p.amount, 0);

	const invoicesSentThisMonth = invoices.filter(
		(inv) =>
			inv.status !== 'Draft' &&
			inv.status !== 'Cancelled' &&
			inv.issue_date >= monthStart &&
			inv.issue_date <= monthEnd
	).length;

	const overdueCount = invoices.filter((inv) => inv.status === 'Overdue').length;

	return {
		invoices,
		stats: {
			totalOutstanding,
			revenueThisMonth,
			invoicesSentThisMonth,
			overdueCount
		},
		currentMonth: now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
		error: null
	};
}) satisfies PageServerLoad;
