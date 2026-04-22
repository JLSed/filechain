export const STEP_LABELS = [
	'Client Information',
	'Application Details',
	'Documents',
	'Review & Submit'
] as const;

/**
 * Maps each step index to the form field keys that belong to it.
 * Used to determine step completion and error states.
 */
export const STEP_FIELD_MAP: Record<number, string[]> = {
	0: [
		'client_profiles.is_individual',
		'client_profiles.first_name',
		'client_profiles.middle_name',
		'client_profiles.last_name',
		'client_profiles.email',
		'client_profiles.mobile_number',
		'client_profiles.nationality',
		'client_profiles.company_name',
		'client_profiles.company_address'
	],
	1: [
		'application.title_of_invention',
		'application.inventor_names',
		'application.contact_details',
		'application.link_to_folder',
		'application.remarks',
		'application.type_of_invention_id'
	],
	2: ['files'],
	3: ['application.team_assigned']
};

/**
 * Required fields per step (non-nullable fields from the Zod schema).
 * Used to determine if a step is considered "complete".
 */
export const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
	0: [
		'client_profiles.is_individual',
		'client_profiles.first_name',
		'client_profiles.last_name',
		'client_profiles.email',
		'client_profiles.mobile_number',
		'client_profiles.nationality'
	],
	1: ['application.title_of_invention', 'application.type_of_invention_id'],
	2: ['files'],
	3: ['application.team_assigned']
};
