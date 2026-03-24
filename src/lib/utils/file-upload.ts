import type { SupabaseClient } from '@supabase/supabase-js';
import { encrypt_file_multi, generate_block_signature } from '$lib/pkg/rust';

interface EncryptionRecipient {
	userId: string;
	publicKeyBytes: Uint8Array;
}

interface EncryptAndUploadParams {
	supabase: SupabaseClient;
	file: File;
	category: string;
	storagePath: string;
	uploaderId: string;
	recipients: EncryptionRecipient[];
	applicationNumber: string;
}

interface EncryptAndUploadResult {
	fileId: string;
}

interface EncryptedDekEntry {
	user_id: string;
	encrypted_dek_hex: string;
	dek_nonce_hex: string;
	ephemeral_public_key_hex: string;
}

interface MultiKeyEncryptResult {
	success: boolean;
	encrypted_data: Uint8Array;
	file_nonce_hex: string;
	original_hash_hex: string;
	dek_entries: EncryptedDekEntry[];
	error_message: string;
}

/**
 * Encrypts a file client-side via WASM (AES-256-GCM hybrid encryption)
 * for multiple recipients, uploads the encrypted blob to Supabase Storage,
 * and inserts file_metadata, file_dek (one per recipient), and file_ledger records.
 */
export async function encryptAndUploadFile({
	supabase,
	file,
	category,
	storagePath,
	uploaderId,
	recipients,
	applicationNumber
}: EncryptAndUploadParams): Promise<EncryptAndUploadResult> {
	console.log('[encryptAndUploadFile] Starting file encryption/upload flow', {
		fileName: file.name,
		fileSize: file.size,
		fileType: file.type,
		category,
		storagePath,
		uploaderId,
		applicationNumber,
		recipientCount: recipients.length,
		recipientUserIds: recipients.map((r) => r.userId)
	});

	const fileBytes = new Uint8Array(await file.arrayBuffer());
	console.log('[encryptAndUploadFile] File converted to bytes', {
		fileName: file.name,
		byteLength: fileBytes.length,
		first16Bytes: Array.from(fileBytes.slice(0, 16))
	});

	// Prepare recipients array for Rust
	const recipientsForRust = recipients.map((r) => ({
		user_id: r.userId,
		public_key: Array.from(r.publicKeyBytes)
	}));
	console.log('[encryptAndUploadFile] Recipients prepared for Rust encryption', {
		recipientCount: recipientsForRust.length,
		recipients: recipientsForRust.map((r) => ({
			user_id: r.user_id,
			public_key_length: r.public_key.length,
			public_key_first8: r.public_key.slice(0, 8)
		}))
	});

	const result: MultiKeyEncryptResult = encrypt_file_multi(fileBytes, recipientsForRust);
	console.log('[encryptAndUploadFile] Rust encryption result', {
		success: result.success,
		error_message: result.error_message,
		encrypted_data_length: result.encrypted_data?.length ?? 0,
		file_nonce_hex: result.file_nonce_hex,
		original_hash_hex: result.original_hash_hex,
		dek_entry_count: result.dek_entries?.length ?? 0,
		dek_entries_preview:
			result.dek_entries?.map((entry) => ({
				user_id: entry.user_id,
				encrypted_dek_hex_prefix: entry.encrypted_dek_hex.slice(0, 16),
				dek_nonce_hex: entry.dek_nonce_hex,
				ephemeral_public_key_hex_prefix: entry.ephemeral_public_key_hex.slice(0, 16)
			})) ?? []
	});

	if (!result.success) {
		console.error('[encryptAndUploadFile] Encryption failed', {
			fileName: file.name,
			errorMessage: result.error_message
		});
		throw new Error(`Encryption failed for "${file.name}": ${result.error_message}`);
	}

	const encryptedBlob = new Blob([new Uint8Array(result.encrypted_data)]);
	const filePath = `${storagePath}/${file.name}.enc`;
	console.log('[encryptAndUploadFile] Encrypted blob ready for upload', {
		filePath,
		blobSize: encryptedBlob.size,
		contentType: 'application/octet-stream'
	});

	// Upload encrypted blob to the 'storage' bucket
	const { error: uploadErr } = await supabase.storage
		.from('storage')
		.upload(filePath, encryptedBlob, {
			contentType: 'application/octet-stream',
			upsert: true
		});
	console.log('[encryptAndUploadFile] Storage upload completed', {
		filePath,
		hadUploadError: Boolean(uploadErr),
		uploadErrorMessage: uploadErr?.message
	});

	if (uploadErr) {
		console.error('[encryptAndUploadFile] Upload failed', {
			fileName: file.name,
			filePath,
			errorMessage: uploadErr.message
		});
		throw new Error(`Upload failed for "${file.name}": ${uploadErr.message}`);
	}

	// Insert file metadata
	const metadataInsertPayload = {
		uploader_id: uploaderId,
		file_name: file.name,
		file_path: filePath,
		file_hash: result.original_hash_hex,
		file_nonce: result.file_nonce_hex,
		size: file.size,
		category,
		application_number: applicationNumber
	};
	console.log('[encryptAndUploadFile] Inserting file metadata', metadataInsertPayload);

	const { data: fileMeta, error: metaErr } = await supabase
		.schema('api')
		.from('file_metadata')
		.insert(metadataInsertPayload)
		.select('file_id')
		.single();
	console.log('[encryptAndUploadFile] Metadata insert result', {
		fileMeta,
		hadMetadataError: Boolean(metaErr),
		metadataErrorMessage: metaErr?.message
	});

	if (metaErr || !fileMeta) {
		console.error('[encryptAndUploadFile] Metadata insert failed', {
			fileName: file.name,
			errorMessage: metaErr?.message
		});
		throw new Error(`Metadata insert failed for "${file.name}": ${metaErr?.message}`);
	}

	// Insert encrypted DEK for each recipient
	const dekInserts = result.dek_entries.map((entry: EncryptedDekEntry) => ({
		file_id: fileMeta.file_id,
		owner_id: entry.user_id,
		encrypted_dek: entry.encrypted_dek_hex,
		dek_nonce: entry.dek_nonce_hex,
		ephemeral_public_key: entry.ephemeral_public_key_hex
	}));
	console.log('[encryptAndUploadFile] Inserting DEK entries', {
		fileId: fileMeta.file_id,
		dekInsertCount: dekInserts.length,
		dekInsertsPreview: dekInserts.map((entry) => ({
			owner_id: entry.owner_id,
			encrypted_dek_prefix: entry.encrypted_dek.slice(0, 16),
			dek_nonce: entry.dek_nonce,
			ephemeral_public_key_prefix: entry.ephemeral_public_key.slice(0, 16)
		}))
	});

	const { error: dekErr } = await supabase.schema('api').from('file_dek').insert(dekInserts);
	console.log('[encryptAndUploadFile] DEK insert result', {
		fileId: fileMeta.file_id,
		hadDekError: Boolean(dekErr),
		dekErrorMessage: dekErr?.message
	});

	if (dekErr) {
		console.error('[encryptAndUploadFile] DEK insert failed', {
			fileName: file.name,
			fileId: fileMeta.file_id,
			errorMessage: dekErr.message
		});
		throw new Error(`DEK insert failed for "${file.name}": ${dekErr.message}`);
	}

	// Generate block signature for the genesis ledger entry
	const timestampMs = Date.now();
	const previousBlockHash = '0';
	console.log('[encryptAndUploadFile] Generating genesis block signature', {
		uploaderId,
		timestampMs,
		fileHash: result.original_hash_hex,
		previousBlockHash
	});

	const signatureResult = generate_block_signature(
		uploaderId,
		timestampMs,
		result.original_hash_hex,
		previousBlockHash
	);
	console.log('[encryptAndUploadFile] Signature generation result', {
		success: signatureResult.success,
		error_message: signatureResult.error_message,
		signature_hex_prefix: signatureResult.signature_hex?.slice(0, 16)
	});

	if (!signatureResult.success) {
		console.error('[encryptAndUploadFile] Signature generation failed', {
			fileName: file.name,
			errorMessage: signatureResult.error_message
		});
		throw new Error(
			`Signature generation failed for "${file.name}": ${signatureResult.error_message}`
		);
	}

	// Insert ledger entry (sequence 0 = genesis version)
	const ledgerInsertPayload = {
		file_id: fileMeta.file_id,
		sequence: 0,
		signature: signatureResult.signature_hex
	};
	console.log('[encryptAndUploadFile] Inserting genesis ledger entry', ledgerInsertPayload);

	const { error: ledgerErr } = await supabase
		.schema('api')
		.from('file_ledger')
		.insert(ledgerInsertPayload);
	console.log('[encryptAndUploadFile] Ledger insert result', {
		fileId: fileMeta.file_id,
		hadLedgerError: Boolean(ledgerErr),
		ledgerErrorMessage: ledgerErr?.message
	});

	if (ledgerErr) {
		console.error('[encryptAndUploadFile] Ledger insert failed', {
			fileName: file.name,
			fileId: fileMeta.file_id,
			errorMessage: ledgerErr.message
		});
		throw new Error(`Ledger insert failed for "${file.name}": ${ledgerErr.message}`);
	}

	console.log('[encryptAndUploadFile] File encryption/upload flow completed', {
		fileName: file.name,
		fileId: fileMeta.file_id,
		filePath,
		uploaderId
	});

	return { fileId: fileMeta.file_id };
}
