import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createInvoice } from '$lib/services/invoice';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ locals: { supabase } }) => {
	const [clientsResult, applicationsResult] = await Promise.all([
		supabase
			.schema('api')
			.from('client_profiles')
			.select(
				'client_id, is_individual, first_name, middle_name, last_name, company_name, tin, registered_address, business_style'
			)
			.order('last_name', { ascending: true }),

		supabase
			.schema('api')
			.from('ip_applications')
			.select('application_id, application_number, title_of_invention, client_id, fees')
			.order('created_at', { ascending: false })
	]);

	return {
		clients: clientsResult.data ?? [],
		applications: applicationsResult.data ?? []
	};
}) satisfies PageServerLoad;

export const actions = {
	createInvoice: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const payloadJson = formData.get('payload') as string;

		if (!payloadJson) {
			return fail(400, { message: 'Missing payload.' });
		}

		let payload;
		try {
			payload = JSON.parse(payloadJson);
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		try {
			const result = await createInvoice(supabase, {
				formData: payload,
				createdBy: session.session.user.id
			});

			// Audit log
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
				details: `${actorName} Created Invoice ${result.invoiceNumber}`,
				severityLevel: 'notice',
				ipAddress,
				eventType: 'Created Invoice'
			});

			return { success: true, invoiceId: result.invoiceId };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Failed to create invoice.';
			return fail(500, { message });
		}
	}
} satisfies Actions;
