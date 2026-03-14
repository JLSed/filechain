import { APPLICATION_STATUS, FILE_CATEGORIES, USER_ROLES } from '$lib/constants/SchemaData';
import * as z from 'zod';

export const AddUserFormSchema = z.object({
	first_name: z.string().min(1, { message: 'First name is required' }),
	middle_name: z.string().optional().default(''),
	last_name: z.string().min(1, { message: 'Last name is required' }),
	email: z.email({ message: 'Please enter a valid email address' }),
	contact_number: z.string().optional().default(''),
	address: z.string().optional().default(''),
	role: z.enum(USER_ROLES, { message: 'Please select a role' })
});

export type AddUserFormData = z.infer<typeof AddUserFormSchema>;

export const SetupAccountFormSchema = z.object({
	password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	public_key: z.string({ message: 'Missing public key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1)
});

export type SetupAccountFormData = z.infer<typeof SetupAccountFormSchema>;

export const LoginFormSchema = z.object({
	email: z.email({ message: 'Please enter a valid email address' }),
	password: z.string().min(7, { message: 'Password must be at least 7 characters long' })
});

export const IpApplicationFormSchema = z.object({
	client_profiles: z.object({
		first_name: z.string(),
		middle_name: z.string(),
		last_name: z.string(),
		email: z.email(),
		mobile_number: z.string(),
		nationality: z.string(),
		company_name: z.string(),
		company_address: z.string()
	}),
	application: z.object({
		application_number: z.string(),
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
		type_of_invention_id: z.number(),
		pre_protection_status_id: z.number().nullable(),
		type_of_office_action_id: z.number().nullable()
	}),
	files: z.array(
		z.object({
			file: z.file(),
			category: z.enum(FILE_CATEGORIES)
		})
	)
});

export type IpApplicationFormData = z.infer<typeof IpApplicationFormSchema>;

export const SetupMasterPasswordSchema = z.object({
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	public_key: z.string({ message: 'Missing public key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1)
});

export type SetupMasterPasswordData = z.infer<typeof SetupMasterPasswordSchema>;
