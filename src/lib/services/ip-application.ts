import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpApplicationFormData } from '$lib/types/FormTypes';
import initWasm from '$lib/pkg/rust';
import { getUserEncryptionKey } from '$lib/utils/crypto';
import { encryptAndUploadFile } from '$lib/utils/file-upload';

/**
 * Submits an IP application:
 * 1. Encrypts each staged file client-side via WASM (AES-256-GCM hybrid encryption).
 * 2. Uploads encrypted blobs to the `storage` bucket at `files/{application_number}/`.
 * 3. Inserts the client profile row.
 * 4. Inserts the application row into `ip_applications` with `link_to_folder` pointing to
 *    the storage directory.
 */
export async function submitIpApplication(
	formData: IpApplicationFormData,
	supabase: SupabaseClient
): Promise<void> {
	const appNumber = formData.application.application_number.trim();
	if (!appNumber) {
		throw new Error('Application number is required.');
	}

	// Ensure WASM module is initialised
	await initWasm();

	// Resolve the user's public key for encryption
	const { userId, publicKeyBytes } = await getUserEncryptionKey(supabase);

	const storagePath = `files/${appNumber}`;

	// Encrypt and upload each file
	for (const staged of formData.files) {
		await encryptAndUploadFile({
			supabase,
			file: staged.file,
			category: staged.category,
			storagePath,
			uploaderId: userId,
			publicKeyBytes,
			applicationNumber: appNumber
		});
	}

	// Insert client profile
	const { data: clientProfile, error: clientError } = await supabase
		.schema('api')
		.from('client_profiles')
		.insert({
			first_name: formData.client_profiles.first_name.trim(),
			middle_name: formData.client_profiles.middle_name.trim() || null,
			last_name: formData.client_profiles.last_name.trim(),
			email: formData.client_profiles.email.trim() || null,
			mobile_number: formData.client_profiles.mobile_number || null,
			nationality: formData.client_profiles.nationality.trim() || null,
			company_name: formData.client_profiles.company_name.trim() || null,
			company_address: formData.client_profiles.company_address.trim() || null
		})
		.select('client_id')
		.single();

	if (clientError || !clientProfile) {
		throw new Error(`Failed to save client profile: ${clientError?.message}`);
	}

	// Insert the IP application
	const { error: insertError } = await supabase
		.schema('api')
		.from('ip_applications')
		.insert({
			application_number: appNumber,
			client_id: clientProfile.client_id,
			title_of_invention: formData.application.title_of_invention.trim(),
			type_of_invention_id: formData.application.type_of_invention_id,
			pre_protection_status_id: formData.application.pre_protection_status_id || null,
			type_of_office_action_id: formData.application.type_of_office_action_id || null,
			status: formData.application.status,
			filling_date: formData.application.filling_date || null,
			paper_document_no: formData.application.paper_document_no || null,
			fees: formData.application.fees,
			deadline: formData.application.deadline || null,
			mailing_date: formData.application.mailing_date || null,
			publication_date: formData.application.publication_date || null,
			inventor_names: formData.application.inventor_names,
			contact_details: formData.application.contact_details || null,
			link_to_folder: storagePath,
			remarks: formData.application.remarks || null
		});

	if (insertError) {
		throw new Error(`Failed to save application: ${insertError.message}`);
	}
}
