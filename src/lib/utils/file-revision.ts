import type { SupabaseClient } from '@supabase/supabase-js';
import type { FileMetadata } from '$lib/types/DatabaseTypes';
import { encrypt_file, generate_block_signature } from '$lib/pkg/rust';

interface UploadRevisionParams {
	supabase: SupabaseClient;
	originalFile: FileMetadata;
	newFile: File;
	uploaderId: string;
	publicKeyBytes: Uint8Array;
}

interface UploadRevisionResult {
	fileId: string;
	sequence: number;
}

/**
 * Uploads a new revision of an existing file:
 * 1. Queries the latest ledger entry for the original file (max sequence).
 * 2. Encrypts the new file via WASM.
 * 3. Uploads the encrypted blob to Supabase Storage.
 * 4. Inserts new file_metadata + file_dek rows.
 * 5. Generates a block signature chaining from the previous block.
 * 6. Inserts a file_ledger row with incremented sequence and previous_block reference.
 */
export async function uploadFileRevision({
	supabase,
	originalFile,
	newFile,
	uploaderId,
	publicKeyBytes
}: UploadRevisionParams): Promise<UploadRevisionResult> {
	// 1. Fetch the latest ledger entry for this file to chain from
	const { data: latestLedger, error: ledgerQueryErr } = await supabase
		.schema('api')
		.from('file_ledger')
		.select('block_id, sequence, signature')
		.eq('file_id', originalFile.file_id)
		.order('sequence', { ascending: false })
		.limit(1)
		.single();

	if (ledgerQueryErr || !latestLedger) {
		throw new Error(
			`Failed to fetch latest ledger entry for "${originalFile.file_name}": ${ledgerQueryErr?.message}`
		);
	}

	const previousBlockId: string = latestLedger.block_id;
	const previousSignature: string = latestLedger.signature ?? '0';
	const nextSequence: number = latestLedger.sequence + 1;

	// 2. Encrypt the new file
	const fileBytes = new Uint8Array(await newFile.arrayBuffer());
	const encResult = encrypt_file(fileBytes, publicKeyBytes);

	if (!encResult.success) {
		throw new Error(`Encryption failed for "${newFile.name}": ${encResult.error_message}`);
	}

	try {
		const encryptedBlob = new Blob([new Uint8Array(encResult.encrypted_data)]);
		const storagePath = `files/${originalFile.application_number}`;
		const filePath = `${storagePath}/${newFile.name}.enc`;

		// 3. Upload encrypted blob
		const { error: uploadErr } = await supabase.storage
			.from('storage')
			.upload(filePath, encryptedBlob, {
				contentType: 'application/octet-stream',
				upsert: true
			});

		if (uploadErr) {
			throw new Error(`Upload failed for "${newFile.name}": ${uploadErr.message}`);
		}

		// 4. Insert file metadata
		const { data: fileMeta, error: metaErr } = await supabase
			.schema('api')
			.from('file_metadata')
			.insert({
				uploader_id: uploaderId,
				file_name: newFile.name,
				file_path: filePath,
				file_hash: encResult.original_hash_hex,
				file_nonce: encResult.file_nonce_hex,
				size: newFile.size,
				category: originalFile.category,
				application_number: originalFile.application_number
			})
			.select('file_id')
			.single();

		if (metaErr || !fileMeta) {
			throw new Error(`Metadata insert failed for "${newFile.name}": ${metaErr?.message}`);
		}

		// 5. Insert encrypted DEK
		const { error: dekErr } = await supabase.schema('api').from('file_dek').insert({
			file_id: fileMeta.file_id,
			owner_id: uploaderId,
			encrypted_dek: encResult.encrypted_dek_hex,
			dek_nonce: encResult.dek_nonce_hex,
			ephemeral_public_key: encResult.ephemeral_public_key_hex
		});

		if (dekErr) {
			throw new Error(`DEK insert failed for "${newFile.name}": ${dekErr.message}`);
		}

		// 6. Generate block signature chaining from the previous block
		const timestampMs = Date.now();
		const signatureResult = generate_block_signature(
			uploaderId,
			timestampMs,
			encResult.original_hash_hex,
			previousSignature
		);

		if (!signatureResult.success) {
			throw new Error(
				`Signature generation failed for "${newFile.name}": ${signatureResult.error_message}`
			);
		}

		// 7. Insert ledger entry with chain reference
		const { error: ledgerErr } = await supabase.schema('api').from('file_ledger').insert({
			file_id: fileMeta.file_id,
			sequence: nextSequence,
			signature: signatureResult.signature_hex,
			previous_block: previousBlockId
		});

		if (ledgerErr) {
			throw new Error(`Ledger insert failed for "${newFile.name}": ${ledgerErr.message}`);
		}

		return { fileId: fileMeta.file_id, sequence: nextSequence };
	} finally {
		encResult.free();
	}
}
