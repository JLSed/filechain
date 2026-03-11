import { error } from '@sveltejs/kit';
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
	if (!supabase)
		throw error(500, 'Unable to connect to the authentication service. Please try again later.');
	const [inventionTypes, protectionStatuses, officeActions] = await Promise.all([
		supabase.schema('api').from('type_of_invention').select('id, name'),
		supabase.schema('api').from('pre_protection_status').select('id, name'),
		supabase.schema('api').from('type_of_office_action').select('id, name')
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
		form: await superValidate(zod4(IpApplicationFormSchema))
	};
};

export const actions = {
	application: async ({ request }) => {
		const form = await superValidate(request, zod4(IpApplicationFormSchema));
	}
};
