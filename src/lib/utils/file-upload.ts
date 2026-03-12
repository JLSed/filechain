import type { SupabaseClient } from '@supabase/supabase-js';
import { encrypt_file } from '$lib/pkg/rust';

interface EncryptAndUploadParams {
	supabase: SupabaseClient;
	file: File;
	category: string;
	storagePath: string;
	uploaderId: string;
	publicKeyBytes: Uint8Array;
	sequence: number;
}

interface EncryptAndUploadResult {
	fileId: string;
}

/**
 * Encrypts a file client-side via WASM (AES-256-GCM hybrid encryption),
 * uploads the encrypted blob to Supabase Storage, and inserts
 * file_metadata, file_dek, and file_ledger records.
 */
export async function encryptAndUploadFile({
	supabase,
	file,
	category,
	storagePath,
	uploaderId,
	publicKeyBytes,
	sequence
}: EncryptAndUploadParams): Promise<EncryptAndUploadResult> {
	const fileBytes = new Uint8Array(await file.arrayBuffer());

	const result = encrypt_file(fileBytes, publicKeyBytes);
	if (!result.success) {
		throw new Error(`Encryption failed for "${file.name}": ${result.error_message}`);
	}

	try {
		const encryptedBlob = new Blob([new Uint8Array(result.encrypted_data)]);
		const filePath = `${storagePath}/${file.name}.enc`;

		// Upload encrypted blob to the 'storage' bucket
		const { error: uploadErr } = await supabase.storage
			.from('storage')
			.upload(filePath, encryptedBlob, {
				contentType: 'application/octet-stream',
				upsert: true
			});

		if (uploadErr) {
			throw new Error(`Upload failed for "${file.name}": ${uploadErr.message}`);
		}

		// Insert file metadata
		const { data: fileMeta, error: metaErr } = await supabase
			.schema('api')
			.from('file_metadata')
			.insert({
				uploader_id: uploaderId,
				file_name: file.name,
				file_path: filePath,
				file_hash: result.original_hash_hex,
				file_nonce: result.file_nonce_hex,
				size: file.size,
				category
			})
			.select('file_id')
			.single();

		if (metaErr || !fileMeta) {
			throw new Error(`Metadata insert failed for "${file.name}": ${metaErr?.message}`);
		}

		// Insert encrypted DEK
		const { error: dekErr } = await supabase.schema('api').from('file_dek').insert({
			file_id: fileMeta.file_id,
			owner_id: uploaderId,
			encrypted_dek: result.encrypted_dek_hex,
			dek_nonce: result.dek_nonce_hex,
			ephemeral_public_key: result.ephemeral_public_key_hex
		});

		if (dekErr) {
			throw new Error(`DEK insert failed for "${file.name}": ${dekErr.message}`);
		}

		// Insert ledger entry
		const { error: ledgerErr } = await supabase.schema('api').from('file_ledger').insert({
			file_id: fileMeta.file_id,
			sequence
		});

		if (ledgerErr) {
			throw new Error(`Ledger insert failed for "${file.name}": ${ledgerErr.message}`);
		}

		return { fileId: fileMeta.file_id };
	} finally {
		result.free();
	}
}
