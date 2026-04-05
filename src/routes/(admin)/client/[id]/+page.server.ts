import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { ClientProfileSchema } from '$lib/types/DatabaseTypes';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ params, locals: { supabase, safeGetSession }, depends }) => {
	depends('db:client-detail');

	const session = await safeGetSession();
	if (!session.session) throw error(401, 'Unauthorized');

	const clientId = params.id;

	const { data, error: dbError } = await supabase
		.schema('api')
		.from('client_profiles')
		.select(
			'client_id, first_name, last_name, middle_name, email, mobile_number, nationality, company_name, company_address, created_at, updated_at'
		)
		.eq('client_id', clientId)
		.single();

	if (dbError || !data) {
		throw error(404, 'Client not found.');
	}

	const parsed = ClientProfileSchema.safeParse(data);
	if (!parsed.success) {
		throw error(500, 'Invalid client data received.');
	}

	return {
		client: parsed.data
	};
}) satisfies PageServerLoad;

export const actions = {
	saveClient: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const clientId = formData.get('client_id') as string;
		const payloadJson = formData.get('payload') as string;
		const changesJson = formData.get('changes') as string | null;

		if (!clientId || !payloadJson) {
			return fail(400, { message: 'Missing required fields.' });
		}

		let updatePayload: Record<string, unknown>;
		try {
			updatePayload = JSON.parse(payloadJson);
			updatePayload.updated_at = new Date().toISOString();
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		// Perform the database update
		const { error: updateError } = await supabase
			.schema('api')
			.from('client_profiles')
			.update(updatePayload)
			.eq('client_id', clientId);

		if (updateError) {
			return fail(500, { message: `Failed to save: ${updateError.message}` });
		}

		// Log audit entry with IP address
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

		// Get the target client's name for the log
		const { data: targetClient } = await supabase
			.schema('api')
			.from('client_profiles')
			.select('first_name, middle_name, last_name')
			.eq('client_id', clientId)
			.single();

		const targetName = targetClient
			? formatName(
					targetClient.first_name ?? '',
					targetClient.middle_name,
					targetClient.last_name ?? ''
				)
			: clientId;

		let parsedChanges: Record<string, { old: unknown; new: unknown }> | null = null;
		if (changesJson) {
			try {
				parsedChanges = JSON.parse(changesJson);
			} catch {
				// Ignore parse errors for changes — still save the update
			}
		}

		await insertAuditLog(supabase, {
			actorId: session.session.user.id,
			details: `${actorName} Edited Client ${targetName}`,
			changes: parsedChanges,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Edited Client'
		});

		return { success: true };
	}
} satisfies Actions;
