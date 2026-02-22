/** Metadata stored in the .meta.json sidecar file alongside each encrypted file */
export interface FileMetadata {
	original_name: string;
	category: string;
	file_nonce_hex: string;
	encrypted_dek_hex: string;
	dek_nonce_hex: string;
	ephemeral_public_key_hex: string;
	original_hash_hex: string;
}

/** User secrets needed for decryption */
export interface UserSecrets {
	encrypted_private_key: string;
	public_key: string;
	pk_salt: string;
	pk_nonce: string;
}

/** Decryption pipeline steps */
export type DecryptionStep =
	| 'idle'
	| 'fetching-meta'
	| 'fetching-secrets'
	| 'downloading-file'
	| 'decrypting'
	| 'done'
	| 'error';

/** Human-readable labels for each decryption step */
export const DECRYPTION_STEP_LABELS: Record<DecryptionStep, string> = {
	idle: 'Ready',
	'fetching-meta': 'Fetching file metadata…',
	'fetching-secrets': 'Retrieving encryption keys…',
	'downloading-file': 'Downloading encrypted file…',
	decrypting: 'Decrypting file…',
	done: 'Decryption complete',
	error: 'Decryption failed'
};

/** Information about a file being viewed after decryption */
export interface DecryptedFileView {
	fileName: string;
	mimeType: string;
	blobUrl: string;
	data: Uint8Array;
}
