import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import {
	InvoiceSchema,
	InvoiceLineItemSchema,
	InvoicePaymentSchema,
	CompanySettingsSchema
} from '$lib/types/DatabaseTypes';
import z from 'zod';
import { sendInvoice, cancelInvoice, recordPayment } from '$lib/services/invoice';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:invoice-detail');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const invoiceId = params.id;

	const [invoiceResult, lineItemsResult, paymentsResult, companyResult] = await Promise.all([
		supabase
			.schema('api')
			.from('invoices')
			.select(
				`*,
				client_profiles!left(first_name, middle_name, last_name, company_name, is_individual, tin, registered_address, business_style, email, mobile_number),
				ip_applications!left(title_of_invention, application_number)`
			)
			.eq('invoice_id', invoiceId)
			.single(),

		supabase
			.schema('api')
			.from('invoice_line_items')
			.select('*')
			.eq('invoice_id', invoiceId)
			.order('sort_order', { ascending: true }),

		supabase
			.schema('api')
			.from('invoice_payments')
			.select('*, user_profiles!left(first_name, last_name)')
			.eq('invoice_id', invoiceId)
			.order('created_at', { ascending: false }),

		supabase.schema('api').from('company_settings').select('*').eq('id', 1).single()
	]);

	if (invoiceResult.error || !invoiceResult.data) {
		throw error(404, 'Invoice not found.');
	}

	const invoiceParsed = InvoiceSchema.safeParse(invoiceResult.data);
	if (!invoiceParsed.success) {
		console.error('Invoice parse error:', invoiceParsed.error.flatten());
		throw error(500, 'Invalid invoice data received.');
	}

	const lineItemsParsed = z.array(InvoiceLineItemSchema).safeParse(lineItemsResult.data ?? []);
	if (!lineItemsParsed.success) {
		console.error('Line items parse error:', lineItemsParsed.error.flatten());
	}

	const paymentsParsed = z.array(InvoicePaymentSchema).safeParse(paymentsResult.data ?? []);
	if (!paymentsParsed.success) {
		console.error('Payments parse error:', paymentsParsed.error.flatten());
	}

	const companyParsed = CompanySettingsSchema.safeParse(companyResult.data);

	return {
		invoice: invoiceParsed.data,
		lineItems: lineItemsParsed.success ? lineItemsParsed.data : [],
		payments: paymentsParsed.success ? paymentsParsed.data : [],
		companySettings: companyParsed.success ? companyParsed.data : null
	};
}) satisfies PageServerLoad;

export const actions = {
	sendInvoice: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const invoiceId = formData.get('invoice_id') as string;
		const invoiceNumber = formData.get('invoice_number') as string;

		try {
			await sendInvoice(supabase, invoiceId);

			let ipAddress = getClientAddress();
			if (ipAddress === '::1') ipAddress = '127.0.0.1';

			const { data: profile } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('first_name, middle_name, last_name')
				.eq('user_id', session.session.user.id)
				.single();

			const actorName = profile
				? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
				: (session.session.user.email ?? 'Unknown');

			await insertAuditLog(supabase, {
				actorId: session.session.user.id,
				details: `${actorName} Sent Invoice ${invoiceNumber}`,
				severityLevel: 'notice',
				ipAddress,
				eventType: 'Edited Invoice'
			});

			return { success: true };
		} catch (err) {
			return fail(500, { message: err instanceof Error ? err.message : 'Failed to send invoice.' });
		}
	},

	cancelInvoice: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const invoiceId = formData.get('invoice_id') as string;
		const invoiceNumber = formData.get('invoice_number') as string;

		try {
			await cancelInvoice(supabase, invoiceId);

			let ipAddress = getClientAddress();
			if (ipAddress === '::1') ipAddress = '127.0.0.1';

			const { data: profile } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('first_name, middle_name, last_name')
				.eq('user_id', session.session.user.id)
				.single();

			const actorName = profile
				? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
				: (session.session.user.email ?? 'Unknown');

			await insertAuditLog(supabase, {
				actorId: session.session.user.id,
				details: `${actorName} Cancelled Invoice ${invoiceNumber}`,
				severityLevel: 'warning',
				ipAddress,
				eventType: 'Cancelled Invoice'
			});

			return { success: true };
		} catch (err) {
			return fail(500, {
				message: err instanceof Error ? err.message : 'Failed to cancel invoice.'
			});
		}
	},

	recordPayment: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const payloadJson = formData.get('payload') as string;

		if (!payloadJson) return fail(400, { message: 'Missing payload.' });

		let payload;
		try {
			payload = JSON.parse(payloadJson);
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		try {
			const result = await recordPayment(supabase, payload, session.session.user.id);

			let ipAddress = getClientAddress();
			if (ipAddress === '::1') ipAddress = '127.0.0.1';

			const { data: profile } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('first_name, middle_name, last_name')
				.eq('user_id', session.session.user.id)
				.single();

			const actorName = profile
				? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
				: (session.session.user.email ?? 'Unknown');

			await insertAuditLog(supabase, {
				actorId: session.session.user.id,
				details: `${actorName} Recorded Payment ${result.receiptNumber}`,
				severityLevel: 'notice',
				ipAddress,
				eventType: 'Recorded Payment'
			});

			return { success: true, receiptNumber: result.receiptNumber };
		} catch (err) {
			return fail(500, {
				message: err instanceof Error ? err.message : 'Failed to record payment.'
			});
		}
	}
} satisfies Actions;
