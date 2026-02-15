/** Represents file metadata returned from the database */
export interface FileMetadata {
	file_id: string;
	uploader_id: string;
	file_name: string;
	file_path: string;
	file_hash: string;
	file_nonce: string;
	uploaded_at: string;
}

/** Represents a file DEK (Data Encryption Key) entry */
export interface FileDek {
	key_id: string;
	file_id: string;
	owner_id: string;
	encrypted_dek: string;
	dek_nonce: string;
	ephemeral_public_key: string;
	created_at: string;
}

/** User secrets needed for file decryption */
export interface UserSecrets {
	encrypted_private_key: string;
	public_key: string;
	pk_salt: string;
	pk_nonce: string;
}

/** Decryption progress steps */
export type DecryptionStep =
	| 'idle'
	| 'fetching-keys'
	| 'downloading-file'
	| 'decrypting-key'
	| 'decrypting-file'
	| 'done'
	| 'error';

/** Labels displayed for each decryption step */
export const STEP_LABELS: Record<DecryptionStep, string> = {
	idle: '',
	'fetching-keys': 'Fetching file keys...',
	'downloading-file': 'Downloading encrypted file...',
	'decrypting-key': 'Decrypting file key...',
	'decrypting-file': 'Decrypting file content...',
	done: 'Decryption complete!',
	error: 'Decryption failed'
};
