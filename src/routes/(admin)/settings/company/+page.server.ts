import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ locals: { supabase } }) => {
	const { data, error } = await supabase
		.schema('api')
		.from('company_settings')
		.select('*')
		.eq('id', 1)
		.single();

	return {
		companySettings: data ?? {
			id: 1,
			company_name: '',
			registered_address: '',
			tin: '',
			vat_status: 'VAT',
			contact_info: '',
			printer_name: null,
			printer_tin: null,
			atp_number: null,
			atp_date_issued: null
		},
		loadError: error ? error.message : null
	};
}) satisfies PageServerLoad;

export const actions = {
	updateSettings: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		// Check role (only System Admin should update)
		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('role, first_name, middle_name, last_name')
			.eq('user_id', session.session.user.id)
			.single();

		if (!profile || profile.role !== 'System Admin') {
			return fail(403, { message: 'Only System Admin can update company settings.' });
		}

		const formData = await request.formData();
		const settings = {
			company_name: (formData.get('company_name') as string) ?? '',
			registered_address: (formData.get('registered_address') as string) ?? '',
			tin: (formData.get('tin') as string) ?? '',
			vat_status: (formData.get('vat_status') as string) ?? 'VAT',
			contact_info: (formData.get('contact_info') as string) ?? '',
			printer_name: (formData.get('printer_name') as string) || null,
			printer_tin: (formData.get('printer_tin') as string) || null,
			atp_number: (formData.get('atp_number') as string) || null,
			atp_date_issued: (formData.get('atp_date_issued') as string) || null,
			updated_at: new Date().toISOString()
		};

		const { error } = await supabase
			.schema('api')
			.from('company_settings')
			.update(settings)
			.eq('id', 1);

		if (error) {
			return fail(500, { message: `Failed to update: ${error.message}` });
		}

		// Audit log
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const actorName = formatName(
			profile.first_name ?? '',
			profile.middle_name,
			profile.last_name ?? ''
		);

		await insertAuditLog(supabase, {
			actorId: session.session.user.id,
			details: `${actorName} Updated Company / BIR Settings`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Edited Account'
		});

		return { success: true };
	}
} satisfies Actions;
