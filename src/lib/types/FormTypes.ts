import { FILE_CATEGORIES, TEAM_ROLES } from '$lib/constants/SchemaData';
import * as z from 'zod';

export const AddUserFormSchema = z.object({
	first_name: z.string().min(1, { message: 'First name is required' }),
	middle_name: z.string().optional().default(''),
	last_name: z.string().min(1, { message: 'Last name is required' }),
	email: z.email({ message: 'Please enter a valid email address' }),
	contact_number: z.string().optional().default(''),
	address: z.string().optional().default(''),
	role: z.string().min(1, { message: 'Please select a role' })
});

export type AddUserFormData = z.infer<typeof AddUserFormSchema>;

export const SetupAccountFormSchema = z.object({
	password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	public_key: z.string({ message: 'Missing public key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1),
	recovery_encrypted_private_key: z.string().optional(),
	recovery_salt: z.string().optional(),
	recovery_nonce: z.string().optional()
});

export type SetupAccountFormData = z.infer<typeof SetupAccountFormSchema>;

export const LoginFormSchema = z.object({
	email: z.email({ message: 'Please enter a valid email address' }),
	password: z.string().min(7, { message: 'Password must be at least 7 characters long' })
});

export const IpApplicationFormSchema = z
	.object({
		client_profiles: z.object({
			client_id: z.string().optional(),
			is_individual: z.boolean(),
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
			title_of_invention: z.string(),
			inventor_names: z.array(z.string()),
			contact_details: z.string().nullable(),
			link_to_folder: z.string(),
			remarks: z.string().nullable(),
			type_of_invention_id: z.number(),
			team_assigned: z.enum(TEAM_ROLES).default('' as unknown as (typeof TEAM_ROLES)[number])
		}),
		files: z.array(
			z.object({
				file: z.file(),
				category: z.enum(FILE_CATEGORIES)
			})
		),
		skip_files: z.boolean().default(false)
	})
	.superRefine(({ client_profiles }, ctx) => {
		if (!client_profiles.mobile_number.trim()) {
			ctx.addIssue({
				code: 'custom',
				path: ['client_profiles', 'mobile_number'],
				message: 'Mobile number is required'
			});
		}

		if (client_profiles.is_individual) {
			if (!client_profiles.first_name.trim()) {
				ctx.addIssue({
					code: 'custom',
					path: ['client_profiles', 'first_name'],
					message: 'First name is required for individual clients'
				});
			}

			if (!client_profiles.last_name.trim()) {
				ctx.addIssue({
					code: 'custom',
					path: ['client_profiles', 'last_name'],
					message: 'Last name is required for individual clients'
				});
			}

			if (!client_profiles.nationality.trim()) {
				ctx.addIssue({
					code: 'custom',
					path: ['client_profiles', 'nationality'],
					message: 'Nationality is required for individual clients'
				});
			}
		} else {
			if (!client_profiles.company_name.trim()) {
				ctx.addIssue({
					code: 'custom',
					path: ['client_profiles', 'company_name'],
					message: 'Company name is required for company clients'
				});
			}

			if (!client_profiles.company_address.trim()) {
				ctx.addIssue({
					code: 'custom',
					path: ['client_profiles', 'company_address'],
					message: 'Company address is required for company clients'
				});
			}
		}
	});

export type IpApplicationFormData = z.infer<typeof IpApplicationFormSchema>;

export const SetupMasterPasswordSchema = z.object({
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	public_key: z.string({ message: 'Missing public key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1),
	recovery_encrypted_private_key: z.string().optional(),
	recovery_salt: z.string().optional(),
	recovery_nonce: z.string().optional()
});

export type SetupMasterPasswordData = z.infer<typeof SetupMasterPasswordSchema>;

export const ChangePasswordSchema = z.object({
	current_password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	new_password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1)
});

export type ChangePasswordData = z.infer<typeof ChangePasswordSchema>;

export const ForgotPasswordSchema = z.object({
	email: z.email({ message: 'Please enter a valid email address' })
});

export type ForgotPasswordData = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
	new_password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	public_key: z.string({ message: 'Missing public key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1),
	recovery_encrypted_private_key: z.string().optional(),
	recovery_salt: z.string().optional(),
	recovery_nonce: z.string().optional()
});

export type ResetPasswordData = z.infer<typeof ResetPasswordSchema>;

export const RecoverWithKeySchema = z.object({
	recovery_key: z.string().min(1, { message: 'Recovery key is required' }),
	new_password: z.string().min(7, { message: 'Password must be at least 7 characters' }),
	encrypted_private_key: z.string({ message: 'Missing encrypted private key' }).min(1),
	pk_salt: z.string({ message: 'Missing salt' }).min(1),
	pk_nonce: z.string({ message: 'Missing nonce' }).min(1),
	recovery_encrypted_private_key: z.string({ message: 'Missing recovery encrypted key' }).min(1),
	recovery_salt: z.string({ message: 'Missing recovery salt' }).min(1),
	recovery_nonce: z.string({ message: 'Missing recovery nonce' }).min(1)
});

export type RecoverWithKeyData = z.infer<typeof RecoverWithKeySchema>;

export const GenerateRecoveryKeySchema = z.object({
	recovery_encrypted_private_key: z.string({ message: 'Missing recovery encrypted key' }).min(1),
	recovery_salt: z.string({ message: 'Missing recovery salt' }).min(1),
	recovery_nonce: z.string({ message: 'Missing recovery nonce' }).min(1)
});

export type GenerateRecoveryKeyData = z.infer<typeof GenerateRecoveryKeySchema>;
