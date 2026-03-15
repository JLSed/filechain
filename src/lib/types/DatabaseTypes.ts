import { APPLICATION_STATUS } from '$lib/constants/SchemaData';
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
	first_name: z.string(),
	last_name: z.string(),
	middle_name: z.string().nullable(),
	email: z.email(),
	mobile_number: z.string().nullable(),
	nationality: z.string(),
	company_name: z.string().nullable(),
	company_address: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string()
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
	application_number: z.string(),
	client_id: z.uuid(),
	title_of_invention: z.string(),
	status: z.enum(APPLICATION_STATUS),
	filling_date: z.string().nullable(),
	paper_document_no: z.string().nullable(),
	fees: z.number().nullable(),
	deadline: z.string().nullable(),
	mailing_date: z.string().nullable(),
	publication_date: z.string().nullable(),
	inventor_names: z.array(z.string()),
	contact_details: z.string().nullable(),
	link_to_folder: z.string(),
	remarks: z.string().nullable(),
	created_at: z.string(),
	updated_at: z.string(),
	type_of_invention: TypeOfInventionSchema,
	pre_protection_status: PreProtectionStatusSchema,
	type_of_office_action: TypeOfOfficeActionSchema,
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
	application_number: z.string(),
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
	old_value: z.string().nullable(),
	new_value: z.string().nullable(),
	affected_column: z.string().nullable(),
	severity_level: z.string(),
	ip_address: z.string().nullable(),
	timestamp: z.string(),
	event_type: z.string()
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

export interface DecryptedFileView {
	fileName: string;
	mimeType: string;
	data: Uint8Array;
	blobUrl: string;
}
