import type { PageServerLoad } from './$types';
import type {
	PreProtectionStatus,
	TypeOfInvention,
	TypeOfOfficeAction
} from '$lib/types/filing-forms/ip-application';

export const load: PageServerLoad = async ({ locals: { supabase } }) => {
	const [inventionTypes, protectionStatuses, officeActions] = await Promise.all([
		supabase.schema('api').from('type_of_invention').select('id, name'),
		supabase.schema('api').from('pre_protection_status').select('id, name'),
		supabase.schema('api').from('type_of_office_action').select('id, name')
	]);

	return {
		inventionTypes: (inventionTypes.data ?? []) as TypeOfInvention[],
		protectionStatuses: (protectionStatuses.data ?? []) as PreProtectionStatus[],
		officeActions: (officeActions.data ?? []) as TypeOfOfficeAction[]
	};
};
