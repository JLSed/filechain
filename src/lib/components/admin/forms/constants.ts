export const STEP_LABELS = [
	'Client Information',
	'Application Details',
	'Document Upload',
	'Review & Submit'
] as const;

/**
 * Maps each step index to the form field keys that belong to it.
 * Used to determine step completion and error states.
 */
export const STEP_FIELD_MAP: Record<number, string[]> = {
	0: [
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
		'application.application_number',
		'application.title_of_invention',
		'application.status',
		'application.filling_date',
		'application.paper_document_no',
		'application.fees',
		'application.deadline',
		'application.mailing_date',
		'application.publication_date',
		'application.inventor_names',
		'application.contact_details',
		'application.link_to_folder',
		'application.remarks',
		'application.type_of_invention_id',
		'application.pre_protection_status_id',
		'application.type_of_office_action_id'
	],
	2: ['files'],
	3: []
};

/**
 * Required fields per step (non-nullable fields from the Zod schema).
 * Used to determine if a step is considered "complete".
 */
export const STEP_REQUIRED_FIELDS: Record<number, string[]> = {
	0: [
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
		'application.application_number',
		'application.title_of_invention',
		'application.status',
		'application.link_to_folder',
		'application.type_of_invention_id',
		'application.pre_protection_status_id',
		'application.type_of_office_action_id'
	],
	2: [],
	3: []
};
