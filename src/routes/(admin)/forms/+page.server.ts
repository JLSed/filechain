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
	application: async ({ request }) => {
		const form = await superValidate(request, zod4(IpApplicationFormSchema));

		if (!form.valid) {
			return fail(400, { form });
		}

		// TODO: handle successful submission
		return { form };
	}
};
