import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpApplicationFormData } from '$lib/types/ip-application';
import { encrypt_file } from '$lib/pkg/rust';

/**
 * Submits an IP application:
 * 1. Encrypts each staged file client-side via WASM (AES-256-GCM hybrid encryption).
 * 2. Uploads encrypted blobs to the `storage` bucket at `files/{application_number}/`.
 * 3. Inserts the application row into `ip_applications` with `link_to_folder` pointing to
 *    the storage directory.
 */
export async function submitIpApplication(
	formData: IpApplicationFormData,
	supabase: SupabaseClient
): Promise<void> {
	const appNumber = formData.applicationNumber.trim();
	if (!appNumber) {
		throw new Error('Application number is required.');
	}

	// ── 1. Resolve the user's public key for encryption ──
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('You must be logged in to file an application.');
	}

	const { data: secret, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('public_key')
		.eq('user_id', user.id)
		.single();

	if (secretError || !secret?.public_key) {
		throw new Error(
			'Could not retrieve encryption key. Please set up your master key first. ' +
				secretError?.message
		);
	}

	const publicKeyBytes = hexToBytes(secret.public_key);
	console.log('Public key bytes length:', publicKeyBytes.length);
	// ── 2. Encrypt and upload each file ──
	const storagePath = `files/${appNumber}`;

	for (const staged of formData.files) {
		const fileBytes = new Uint8Array(await staged.file.arrayBuffer());

		// Client-side encryption via WASM
		const result = encrypt_file(fileBytes, publicKeyBytes);
		if (!result.success) {
			throw new Error(`Encryption failed for ${staged.file.name}: ${result.error_message}`);
		}

		// Build a metadata JSON blob to store alongside the encrypted data
		const meta = JSON.stringify({
			original_name: staged.file.name,
			category: staged.category,
			file_nonce_hex: result.file_nonce_hex,
			encrypted_dek_hex: result.encrypted_dek_hex,
			dek_nonce_hex: result.dek_nonce_hex,
			ephemeral_public_key_hex: result.ephemeral_public_key_hex,
			original_hash_hex: result.original_hash_hex
		});

		const encryptedBlob = new Blob([result.encrypted_data as BlobPart]);
		const filePath = `${storagePath}/${staged.file.name}.enc`;
		const metaPath = `${storagePath}/${staged.file.name}.meta.json`;

		// Upload encrypted file to the 'storage' bucket
		const { error: uploadErr } = await supabase.storage
			.from('storage')
			.upload(filePath, encryptedBlob, {
				contentType: 'application/octet-stream',
				upsert: true
			});

		if (uploadErr) {
			throw new Error(`Upload failed for ${staged.file.name}: ${uploadErr.message}`);
		}

		// Upload metadata sidecar
		const { error: metaErr } = await supabase.storage
			.from('storage')
			.upload(metaPath, new Blob([meta], { type: 'application/json' }), {
				contentType: 'application/json',
				upsert: true
			});

		if (metaErr) {
			throw new Error(`Metadata upload failed for ${staged.file.name}: ${metaErr.message}`);
		}

		// Free WASM memory
		result.free();
	}

	// ── 3. Insert client profile row ──
	const { data: clientProfile, error: clientError } = await supabase
		.schema('api')
		.from('client_profiles')
		.insert({
			first_name: formData.clientFirstName.trim(),
			middle_name: formData.clientMiddleName.trim() || null,
			last_name: formData.clientLastName.trim(),
			email: formData.clientEmail.trim() || null,
			mobile_number: formData.clientMobileNumber
				? `${formData.clientDialCode} ${formData.clientMobileNumber}`
				: null,
			nationality: formData.clientNationality.trim() || null,
			company_name: formData.clientCompany.trim() || null,
			company_address: formData.clientCompanyAddress.trim() || null
		})
		.select('client_id')
		.single();

	if (clientError || !clientProfile) {
		throw new Error(`Failed to save client profile: ${clientError?.message}`);
	}

	// ── 4. Insert the IP application row ──
	const inventorNames = formData.inventorNames
		.split(',')
		.map((n) => n.trim())
		.filter(Boolean);

	const { error: insertError } = await supabase
		.schema('api')
		.from('ip_applications')
		.insert({
			application_number: appNumber,
			client_id: clientProfile.client_id,
			title_of_invention: formData.titleOfInvention.trim(),
			type_of_invention_id: formData.typeOfInventionId,
			pre_protection_status_id: formData.preProtectionStatusId,
			type_of_office_action_id: formData.typeOfOfficeActionId,
			status: 'Submitted',
			filling_date: formData.fillingDate || null,
			paper_document_no: formData.paperDocumentNo || null,
			fees: formData.fees ? parseFloat(formData.fees) : null,
			deadline: formData.deadline || null,
			mailing_date: formData.mailingDate || null,
			publication_date: formData.publicationDate || null,
			inventor_names: inventorNames,
			contact_details: formData.contactDetails || null,
			link_to_folder: storagePath,
			remarks: formData.remarks || null
		});

	if (insertError) {
		throw new Error(`Failed to save application: ${insertError.message}`);
	}
}

/** Convert a hex string to Uint8Array */
function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}
