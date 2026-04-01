import type { SupabaseClient } from '@supabase/supabase-js';
import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
import { decrypt_file } from '$lib/pkg/rust';
import initWasm from '$lib/pkg/rust';
import { hexToBytes } from '$lib/utils/crypto';
import { getMimeType } from '$lib/utils/file';

interface DecryptFileParams {
	supabase: SupabaseClient;
	file: FileMetadata;
	password: string;
}

/**
 * Decrypts an encrypted file from storage using the user's master password.
 *
 * Steps:
 * 1. Fetches the user's encrypted private key (user_secrets)
 * 2. Fetches the file's DEK and encryption metadata (file_dek + file_metadata)
 * 3. Downloads the encrypted blob from storage
 * 4. Passes everything to the WASM decrypt_file function
 * 5. Returns a DecryptedFileView ready for display
 */
export async function decryptAndViewFile({
	supabase,
	file,
	password
}: DecryptFileParams): Promise<DecryptedFileView> {
	await initWasm();

	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('You must be logged in to decrypt files.');
	}

	// Fetch user secrets (encrypted private key + salt + nonce)
	const { data: secret, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('encrypted_private_key, pk_salt, pk_nonce')
		.eq('user_id', user.id)
		.single();

	if (secretError || !secret) {
		throw new Error(
			'Could not retrieve your encryption keys. Please set up your master key first.'
		);
	}

	// Fetch file DEK (encrypted data encryption key + nonce + ephemeral key)
	const { data: dek, error: dekError } = await supabase
		.schema('api')
		.from('file_dek')
		.select('encrypted_dek, dek_nonce, ephemeral_public_key')
		.eq('file_id', file.file_id)
		.eq('owner_id', user.id)
		.single();

	if (dekError || !dek) {
		throw new Error(
			'Could not retrieve the file encryption key. You may not have access to this file.'
		);
	}

	// Fetch the file nonce from file_metadata
	const { data: fileMeta, error: fileMetaError } = await supabase
		.schema('api')
		.from('file_metadata')
		.select('file_nonce')
		.eq('file_id', file.file_id)
		.single();

	if (fileMetaError || !fileMeta?.file_nonce) {
		throw new Error('Could not retrieve file encryption metadata.');
	}

	// Download encrypted file from storage
	const { data: encryptedBlob, error: downloadError } = await supabase.storage
		.from('storage')
		.download(file.file_path);

	if (downloadError || !encryptedBlob) {
		throw new Error('Failed to download the encrypted file from storage.');
	}

	const encryptedData = new Uint8Array(await encryptedBlob.arrayBuffer());

	// Build the decryption context and call WASM
	const result = decrypt_file({
		encrypted_data: encryptedData,
		password,
		pk_salt: secret.pk_salt,
		encrypted_private_key: Array.from(hexToBytes(secret.encrypted_private_key)),
		pk_nonce: Array.from(hexToBytes(secret.pk_nonce)),
		ephemeral_public_key: Array.from(hexToBytes(dek.ephemeral_public_key)),
		encrypted_dek: Array.from(hexToBytes(dek.encrypted_dek)),
		dek_nonce: Array.from(hexToBytes(dek.dek_nonce)),
		file_nonce: Array.from(hexToBytes(fileMeta.file_nonce))
	});

	if (!result.success) {
		const msg = result.error_message || 'Decryption failed';
		result.free();
		throw new Error(
			msg.includes('decryption') ? 'Incorrect master password or corrupted file.' : msg
		);
	}

	try {
		const decryptedData = new Uint8Array(result.decrypted_data);
		const mimeType = getMimeType(file.file_name);
		const blob = new Blob([decryptedData], { type: mimeType });
		const blobUrl = URL.createObjectURL(blob);

		return {
			fileName: file.file_name,
			mimeType,
			data: decryptedData,
			blobUrl
		};
	} finally {
		result.free();
	}
}
