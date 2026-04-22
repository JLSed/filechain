import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import {
	PreProtectionStatusSchema,
	TypeOfInventionSchema,
	TypeOfOfficeActionSchema
} from '$lib/types/DatabaseTypes';
import { superValidate } from 'sveltekit-superforms';
import { IpApplicationFormSchema } from '$lib/types/FormTypes.js';
import type { IpApplicationFormData } from '$lib/types/FormTypes.js';
import { formatName } from '$lib/utils/formatter';
import { insertAuditLog } from '$lib/services/audit-log';
import { insertNotificationBatch } from '$lib/services/notification';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [inventionTypes, protectionStatuses, officeActions, clientProfilesResult] =
		await Promise.all([
			supabase.schema('api').from('type_of_invention').select('id, name'),
			supabase.schema('api').from('pre_protection_status').select('id, name'),
			supabase.schema('api').from('type_of_office_action').select('id, name'),
			supabase
				.schema('api')
				.from('client_profiles')
				.select(
					'client_id, first_name, middle_name, last_name, email, mobile_number, nationality, company_name, company_address'
				)
				.order('last_name', { ascending: true })
		]);

	const cleanData = {
		inventionTypes: z.array(TypeOfInventionSchema).safeParse(inventionTypes.data),
		protectionStatuses: z.array(PreProtectionStatusSchema).safeParse(protectionStatuses.data),
		officeActions: z.array(TypeOfOfficeActionSchema).safeParse(officeActions.data)
	};

	// TODO: improve error handling here
	if (
		!cleanData.inventionTypes.success ||
		!cleanData.protectionStatuses.success ||
		!cleanData.officeActions.success
	) {
		const errors = [
			!cleanData.inventionTypes.success &&
				`inventionTypes: ${cleanData.inventionTypes.error.message}`,
			!cleanData.protectionStatuses.success &&
				`protectionStatuses: ${cleanData.protectionStatuses.error.message}`,
			!cleanData.officeActions.success && `officeActions: ${cleanData.officeActions.error.message}`
		]
			.filter(Boolean)
			.join(' | ');

		throw error(500, `Failed to fetch data: ${errors}`);
	}

	return {
		inventionTypes: cleanData.inventionTypes.data,
		protectionStatuses: cleanData.protectionStatuses.data,
		officeActions: cleanData.officeActions.data,
		clientProfiles: clientProfilesResult.data ?? [],
		form: await superValidate(zod4(IpApplicationFormSchema))
	};
};

export const actions = {
	application: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const session = await safeGetSession();
		if (!session.session) return fail(401, { message: 'Unauthorized' });

		const formData = await request.formData();
		const payloadJson = formData.get('payload') as string;

		if (!payloadJson) {
			return fail(400, { message: 'Missing payload.' });
		}

		let payload: IpApplicationFormData;
		try {
			payload = JSON.parse(payloadJson);
		} catch {
			return fail(400, { message: 'Invalid payload.' });
		}

		// Insert client profile if needed
		let clientId = payload.client_profiles.client_id;
		if (!clientId) {
			const { data: clientProfile, error: clientError } = await supabase
				.schema('api')
				.from('client_profiles')
				.insert({
					first_name: payload.client_profiles.first_name?.trim() || '',
					middle_name: payload.client_profiles.middle_name?.trim() || null,
					last_name: payload.client_profiles.last_name?.trim() || '',
					email: payload.client_profiles.email?.trim() || null,
					mobile_number: payload.client_profiles.mobile_number || null,
					nationality: payload.client_profiles.nationality?.trim() || null,
					company_name: payload.client_profiles.company_name?.trim() || null,
					company_address: payload.client_profiles.company_address?.trim() || null
				})
				.select('client_id')
				.single();

			if (clientError || !clientProfile) {
				return fail(500, { message: `Failed to save client profile: ${clientError?.message}` });
			}
			clientId = clientProfile.client_id;
		}

		const teamRole = payload.application.team_assigned;

		// Insert application (application_id is auto-generated as UUID)
		const { data: insertedApp, error: insertError } = await supabase
			.schema('api')
			.from('ip_applications')
			.insert({
				client_id: clientId,
				title_of_invention: payload.application.title_of_invention?.trim() || '',
				type_of_invention_id: payload.application.type_of_invention_id,
				status: 'Client Intake',
				inventor_names: payload.application.inventor_names,
				contact_details: payload.application.contact_details || null,
				remarks: payload.application.remarks || null,
				team_assigned: teamRole
			})
			.select('application_id')
			.single();

		if (insertError || !insertedApp) {
			return fail(500, { message: `Failed to save application: ${insertError?.message}` });
		}

		const applicationId = insertedApp.application_id;

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

		await insertAuditLog(supabase, {
			actorId: session.session.user.id,
			details: `${actorName} Submitted Application ${applicationId}`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Submitted Application'
		});

		// Notify team members
		try {
			const { data: teamMembers } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('user_id')
				.or(`role.eq.${teamRole},role.eq.System Admin`)
				.neq('user_id', session.session.user.id);

			if (teamMembers && teamMembers.length > 0) {
				const recipientIds = teamMembers.map((m: { user_id: string }) => m.user_id);
				await insertNotificationBatch(supabase, recipientIds, {
					actorId: session.session.user.id,
					title: 'New Application Assigned',
					message: `${actorName} assigned your team for application ${applicationId}`,
					link: `/application/${applicationId}`
				});
			}
		} catch (notifError) {
			console.error('Failed to send notifications:', notifError);
		}

		return { success: true, applicationId };
	}
};
