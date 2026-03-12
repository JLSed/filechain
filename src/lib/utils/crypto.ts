import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Converts a hex-encoded string to a Uint8Array of bytes.
 */
export function hexToBytes(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error('Hex string must have an even number of characters.');
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Converts a Uint8Array of bytes to a lowercase hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
	return Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Fetches the authenticated user's public encryption key from the database.
 * Returns the user ID and the public key as raw bytes.
 */
export async function getUserEncryptionKey(
	supabase: SupabaseClient
): Promise<{ userId: string; publicKeyBytes: Uint8Array }> {
	const {
		data: { user }
	} = await supabase.auth.getUser();

	if (!user) {
		throw new Error('You must be logged in to perform this action.');
	}

	const { data: secret, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('public_key')
		.eq('user_id', user.id)
		.single();

	if (secretError || !secret?.public_key) {
		throw new Error('Could not retrieve encryption key. Please set up your master key first.');
	}

	return {
		userId: user.id,
		publicKeyBytes: hexToBytes(secret.public_key)
	};
}
