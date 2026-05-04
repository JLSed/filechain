import {
	APPLICATION_STATUS,
	INVOICE_STATUSES,
	LINE_ITEM_TYPES,
	PAYMENT_METHODS
} from '$lib/constants/SchemaData';
import type { User } from '@supabase/supabase-js';
import * as z from 'zod';

export const UserProfileSchema = z.object({
	user_id: z.uuid(),
	role: z.string().nullable(),
	first_name: z.string().nullable(),
	last_name: z.string().nullable(),
	middle_name: z.string().nullable(),
	is_active: z.boolean(),
	created_at: z.string(),
	contact_number: z.string().nullable(),
	address: z.string().nullable(),
	email: z.string().nullable()
});

export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UserMetadata = User;

export const UserSecretSchema = z.object({
	user_id: z.uuid(),
	encrypted_private_key: z.string(),
	public_key: z.string(),
	pk_salt: z.string(),
	pk_nonce: z.string(),
	created_at: z.string()
});

export type UserSecret = z.infer<typeof UserSecretSchema>;

export const ClientProfileSchema = z.object({
	client_id: z.uuid(),
	is_individual: z.boolean(),
	first_name: z.string(),
	last_name: z.string(),
	middle_name: z.string().nullable(),
	email: z.email(),
	mobile_number: z.string().nullable(),
	nationality: z.string(),
	company_name: z.string().nullable(),
	company_address: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	tin: z.string().nullable().optional(),
	business_style: z.string().nullable().optional(),
	registered_address: z.string().nullable().optional()
});

export type ClientProfile = z.infer<typeof ClientProfileSchema>;

export const TypeOfInventionSchema = z
	.object({
		id: z.int().optional(),
		name: z.string(),
		created_at: z.date().optional()
	})
	.nullable()
	.optional();

export type TypeOfInvention = z.infer<typeof TypeOfInventionSchema>;

export const PreProtectionStatusSchema = z
	.object({
		id: z.int().optional(),
		name: z.string(),
		created_at: z.date().optional()
	})
	.nullable()
	.optional();

export type PreProtectionStatus = z.infer<typeof PreProtectionStatusSchema>;

export const TypeOfOfficeActionSchema = z
	.object({
		id: z.int().optional(),
		name: z.string(),
		created_at: z.date().optional()
	})
	.nullable()
	.optional();
export type TypeOfOfficeAction = z.infer<typeof TypeOfOfficeActionSchema>;

export const IpApplicationSchema = z.object({
	application_id: z.uuid(),
	application_number: z.string().nullable(),
	client_id: z.uuid(),
	title_of_invention: z.string(),
	status: z.enum(APPLICATION_STATUS),
	filling_date: z.string().nullable(),
	paper_document_no: z.string().nullable(),
	fees: z.coerce.number().nullable(),
	deadline: z.string().nullable(),
	mailing_date: z.string().nullable(),
	publication_date: z.string().nullable(),
	inventor_names: z.array(z.string()),
	contact_details: z.string().nullable(),
	link_to_folder: z.string().nullable(),
	remarks: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	type_of_invention: TypeOfInventionSchema,
	pre_protection_status: PreProtectionStatusSchema,
	type_of_office_action: TypeOfOfficeActionSchema,
	team_assigned: z.string().nullable(),
	client_profiles: z
		.object({
			first_name: z.string(),
			last_name: z.string(),
			email: z.string()
		})
		.optional()
});

export type IpApplication = z.infer<typeof IpApplicationSchema>;

export const FileMetadataSchema = z.object({
	file_id: z.uuid(),
	uploader_id: z.uuid(),
	file_name: z.string(),
	file_path: z.string(),
	uploaded_at: z.string(),
	size: z.number(),
	status: z.string().nullable(),
	category: z.string().nullable(),
	application_id: z.uuid().nullable().optional(),
	file_hash: z.string().optional(),
	file_ledger: z
		.array(
			z.object({
				block_id: z.string(),
				sequence: z.number(),
				signature: z.string().nullable(),
				previous_block: z.string().nullable()
			})
		)
		.optional(),
	user_profiles: z
		.object({
			first_name: z.string(),
			last_name: z.string()
		})
		.nullable()
		.optional()
});

export type FileMetadata = z.infer<typeof FileMetadataSchema>;

export const AuditLogSchema = z.object({
	log_id: z.uuid(),
	actor_id: z.uuid().nullable(),
	details: z.string(),
	changes: z.record(z.string(), z.object({ old: z.unknown(), new: z.unknown() })).nullable(),
	severity_level: z.string(),
	ip_address: z.string().nullable(),
	timestamp: z.string(),
	event_type: z.string(),
	user_profiles: z
		.object({
			first_name: z.string().nullable(),
			last_name: z.string().nullable(),
			role: z.string().nullable()
		})
		.nullable()
		.optional()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export const ApplicationTaskSchema = z.object({
	task_id: z.uuid(),
	application_id: z.uuid(),
	title: z.string(),
	description: z.string().nullable(),
	is_completed: z.boolean(),
	completed_by: z.uuid().nullable(),
	completed_at: z.string().nullable(),
	created_by: z.uuid(),
	created_at: z.string()
});

export type ApplicationTask = z.infer<typeof ApplicationTaskSchema>;

export interface DecryptedFileView {
	fileName: string;
	mimeType: string;
	data: Uint8Array;
	blobUrl: string;
}

// ── Invoice Schemas ──

export const InvoiceSchema = z.object({
	invoice_id: z.uuid(),
	invoice_number: z.string(),
	client_id: z.uuid(),
	application_id: z.uuid(),
	issue_date: z.string(),
	due_date: z.string().nullable(),
	status: z.enum(INVOICE_STATUSES),
	notes: z.string().nullable(),
	vatable_sales: z.coerce.number(),
	vat_amount: z.coerce.number(),
	vat_exempt_sales: z.coerce.number(),
	zero_rated_sales: z.coerce.number(),
	total_amount: z.coerce.number(),
	amount_paid: z.coerce.number(),
	ewt_amount: z.coerce.number(),
	created_by: z.uuid(),
	created_at: z.string(),
	updated_at: z.string(),
	// Joined relations (optional, present when fetched with joins)
	client_profiles: z
		.object({
			first_name: z.string(),
			last_name: z.string(),
			middle_name: z.string().nullable().optional(),
			company_name: z.string().nullable().optional(),
			is_individual: z.boolean().optional(),
			tin: z.string().nullable().optional(),
			registered_address: z.string().nullable().optional(),
			business_style: z.string().nullable().optional(),
			email: z.string().nullable().optional(),
			mobile_number: z.string().nullable().optional()
		})
		.optional(),
	ip_applications: z
		.object({
			title_of_invention: z.string(),
			application_number: z.string().nullable().optional()
		})
		.optional()
});

export type Invoice = z.infer<typeof InvoiceSchema>;

export const InvoiceLineItemSchema = z.object({
	line_item_id: z.uuid(),
	invoice_id: z.uuid(),
	description: z.string(),
	quantity: z.number(),
	unit_cost: z.coerce.number(),
	total_amount: z.coerce.number(),
	line_type: z.enum(LINE_ITEM_TYPES),
	is_vatable: z.boolean(),
	sort_order: z.number(),
	created_at: z.string()
});

export type InvoiceLineItem = z.infer<typeof InvoiceLineItemSchema>;

export const InvoicePaymentSchema = z.object({
	payment_id: z.uuid(),
	invoice_id: z.uuid(),
	receipt_number: z.string(),
	amount: z.coerce.number(),
	payment_date: z.string(),
	payment_method: z.enum(PAYMENT_METHODS),
	ewt_amount: z.coerce.number(),
	ewt_rate: z.coerce.number().nullable(),
	notes: z.string().nullable(),
	recorded_by: z.uuid(),
	created_at: z.string(),
	// Joined relation (optional)
	user_profiles: z
		.object({
			first_name: z.string().nullable(),
			last_name: z.string().nullable()
		})
		.nullable()
		.optional()
});

export type InvoicePayment = z.infer<typeof InvoicePaymentSchema>;

export const CompanySettingsSchema = z.object({
	id: z.number(),
	company_name: z.string(),
	registered_address: z.string(),
	tin: z.string(),
	vat_status: z.string(),
	contact_info: z.string(),
	printer_name: z.string().nullable(),
	printer_tin: z.string().nullable(),
	atp_number: z.string().nullable(),
	atp_date_issued: z.string().nullable(),
	updated_at: z.string()
});

export type CompanySettings = z.infer<typeof CompanySettingsSchema>;

// ── RBAC Schemas ──

export const PermissionSchema = z.object({
	permission_id: z.uuid(),
	key: z.string(),
	label: z.string(),
	description: z.string().nullable(),
	category: z.string(),
	sort_order: z.number()
});

export type Permission = z.infer<typeof PermissionSchema>;

export const RoleSchema = z.object({
	role_id: z.uuid(),
	name: z.string(),
	description: z.string().nullable(),
	is_system: z.boolean(),
	created_at: z.string(),
	updated_at: z.string()
});

export type Role = z.infer<typeof RoleSchema>;

export const RolePermissionSchema = z.object({
	role: z.string(),
	permission_id: z.uuid(),
	granted_at: z.string(),
	granted_by: z.uuid().nullable()
});

export type RolePermission = z.infer<typeof RolePermissionSchema>;
