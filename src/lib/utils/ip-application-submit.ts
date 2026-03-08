import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpApplicationFormData } from '$lib/types/filing-forms/ip-application';
import initWasm, { encrypt_file } from '$lib/pkg/rust';

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

	// ── 0. Ensure WASM module is initialised ──
	await initWasm();

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

	// ── 2. Encrypt and upload each file ──
	const storagePath = `files/${appNumber}`;

	// Fetch the current max sequence in file_ledger to continue from
	const { data: maxSeqRow } = await supabase
		.schema('api')
		.from('file_ledger')
		.select('sequence')
		.order('sequence', { ascending: false })
		.limit(1)
		.single();

	let nextSequence = maxSeqRow ? maxSeqRow.sequence + 1 : 0;

	for (const staged of formData.files) {
		const fileBytes = new Uint8Array(await staged.file.arrayBuffer());

		// Client-side encryption via WASM
		const result = encrypt_file(fileBytes, publicKeyBytes);
		if (!result.success) {
			throw new Error(`Encryption failed for ${staged.file.name}: ${result.error_message}`);
		}

		const encryptedBlob = new Blob([result.encrypted_data as BlobPart]);
		const filePath = `${storagePath}/${staged.file.name}.enc`;

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

		// Insert file metadata into the database
		const { data: fileMeta, error: metaErr } = await supabase
			.schema('api')
			.from('file_metadata')
			.insert({
				uploader_id: user.id,
				file_name: staged.file.name,
				file_path: filePath,
				file_hash: result.original_hash_hex,
				file_nonce: result.file_nonce_hex,
				size: staged.file.size,
				category: staged.category
			})
			.select('file_id')
			.single();

		if (metaErr || !fileMeta) {
			throw new Error(`Metadata insert failed for ${staged.file.name}: ${metaErr?.message}`);
		}

		// Insert the encrypted DEK into file_dek
		const { error: dekErr } = await supabase.schema('api').from('file_dek').insert({
			file_id: fileMeta.file_id,
			owner_id: user.id,
			encrypted_dek: result.encrypted_dek_hex,
			dek_nonce: result.dek_nonce_hex,
			ephemeral_public_key: result.ephemeral_public_key_hex
		});

		if (dekErr) {
			throw new Error(`DEK insert failed for ${staged.file.name}: ${dekErr.message}`);
		}

		// Insert a ledger entry for the file
		const { error: ledgerErr } = await supabase.schema('api').from('file_ledger').insert({
			file_id: fileMeta.file_id,
			sequence: nextSequence
		});

		if (ledgerErr) {
			throw new Error(`Ledger insert failed for ${staged.file.name}: ${ledgerErr.message}`);
		}

		nextSequence++;

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
