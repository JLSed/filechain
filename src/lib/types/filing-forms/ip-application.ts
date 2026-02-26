/**
 * Types for the IP Application feature.
 */

/** A row from the pre_protection_status lookup table */
export interface PreProtectionStatus {
	id: number;
	name: string;
}

/** A row from the type_of_invention lookup table */
export interface TypeOfInvention {
	id: number;
	name: string;
}

/** A row from the type_of_office_action lookup table */
export interface TypeOfOfficeAction {
	id: number;
	name: string;
}

/** Allowed status values for an IP application */
export type IpApplicationStatus = 'Assigned' | 'Extended' | 'Submitted' | 'For Pickup' | 'Closed';

/** The shape of a client_profiles row */
export interface ClientProfile {
	client_id: string;
	first_name: string;
	middle_name: string | null;
	last_name: string;
	email: string | null;
	mobile_number: string | null;
	nationality: string | null;
	company_name: string | null;
	company_address: string | null;
	created_at?: string;
	updated_at?: string;
}

/** The shape of an ip_applications row */
export interface IpApplication {
	application_number: string;
	client_id: string | null;
	title_of_invention: string;
	type_of_invention_id: number;
	pre_protection_status_id: number | null;
	type_of_office_action_id: number | null;
	status: IpApplicationStatus;
	filling_date: string | null;
	paper_document_no: string | null;
	fees: number | null;
	deadline: string | null;
	mailing_date: string | null;
	publication_date: string | null;
	inventor_names: string[];
	contact_details: string | null;
	link_to_folder: string | null;
	remarks: string | null;
}

/** Category for an uploaded document */
export type DocumentCategory =
	| 'Specification'
	| 'Claims'
	| 'Abstract'
	| 'Drawings'
	| 'Declaration'
	| 'Assignment'
	| 'Power of Attorney'
	| 'Priority Document'
	| 'Other';

/** A file staged for upload with its category */
export interface StagedFile {
	file: File;
	category: DocumentCategory;
}

/** Form data collected across all wizard steps */
export interface IpApplicationFormData {
	// Step 1 – Client Information
	clientFirstName: string;
	clientMiddleName: string;
	clientLastName: string;
	clientEmail: string;
	clientMobileNumber: string;
	clientDialCode: string;
	clientNationality: string;
	clientCompany: string;
	clientCompanyAddress: string;

	// Step 2 – Application Details
	titleOfInvention: string;
	typeOfInventionId: number | null;
	preProtectionStatusId: number | null;
	typeOfOfficeActionId: number | null;
	applicationNumber: string;
	fillingDate: string;
	paperDocumentNo: string;
	fees: string;
	deadline: string;
	mailingDate: string;
	publicationDate: string;
	inventorNames: string;
	contactDetails: string;

	// Step 3 – Document Upload
	files: StagedFile[];

	// Step 4 – Internal Notes
	remarks: string;
}

/** Labels for wizard steps */
export const STEP_LABELS = [
	'Client Information',
	'Application Details',
	'Document Upload',
	'Internal Notes',
	'Final Review'
] as const;

/** Available document categories */
export const DOCUMENT_CATEGORIES: DocumentCategory[] = [
	'Specification',
	'Claims',
	'Abstract',
	'Drawings',
	'Declaration',
	'Assignment',
	'Power of Attorney',
	'Priority Document',
	'Other'
];
