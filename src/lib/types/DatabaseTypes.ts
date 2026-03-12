import { APPLICATION_STATUS } from '$lib/constants/SchemaData';
import type { User } from '@supabase/supabase-js';
import * as z from 'zod';

export const UserProfileSchema = z.object({
	user_id: z.uuid(),
	role: z.string(),
	first_name: z.string(),
	last_name: z.string(),
	middle_name: z.string().nullable(),
	is_active: z.boolean()
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
	company_name: z.string(),
	company_address: z.string(),
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
	file_ledger: z
		.array(
			z.object({
				sequence: z.number()
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
