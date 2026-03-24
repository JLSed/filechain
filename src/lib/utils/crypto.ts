import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Converts a hex-encoded string to a Uint8Array of bytes.
 */
export function hexToBytes(hex: string): Uint8Array {
	console.log('[hexToBytes] Converting hex to bytes', {
		hexLength: hex.length,
		hexPrefix: hex.slice(0, 16)
	});

	if (hex.length % 2 !== 0) {
		console.error('[hexToBytes] Invalid hex length', {
			hexLength: hex.length,
			hexPrefix: hex.slice(0, 16)
		});
		throw new Error('Hex string must have an even number of characters.');
	}
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}

	console.log('[hexToBytes] Conversion complete', {
		outputByteLength: bytes.length,
		first16Bytes: Array.from(bytes.slice(0, 16))
	});

	return bytes;
}

/**
 * Converts a Uint8Array of bytes to a lowercase hex string.
 */
export function bytesToHex(bytes: Uint8Array): string {
	console.log('[bytesToHex] Converting bytes to hex', {
		inputByteLength: bytes.length,
		first16Bytes: Array.from(bytes.slice(0, 16))
	});

	const hex = Array.from(bytes)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');

	console.log('[bytesToHex] Conversion complete', {
		hexLength: hex.length,
		hexPrefix: hex.slice(0, 16)
	});

	return hex;
}

/**
 * Fetches the authenticated user's public encryption key from the database.
 * Returns the user ID and the public key as raw bytes.
 */
export async function getUserEncryptionKey(
	supabase: SupabaseClient
): Promise<{ userId: string; publicKeyBytes: Uint8Array }> {
	console.log('[getUserEncryptionKey] Fetching current authenticated user');

	const {
		data: { user }
	} = await supabase.auth.getUser();

	console.log('[getUserEncryptionKey] Auth user fetch result', {
		hasUser: Boolean(user),
		userId: user?.id
	});

	if (!user) {
		console.error('[getUserEncryptionKey] No authenticated user found');
		throw new Error('You must be logged in to perform this action.');
	}

	console.log('[getUserEncryptionKey] Fetching user public key', {
		userId: user.id
	});

	const { data: secret, error: secretError } = await supabase
		.schema('api')
		.from('user_secrets')
		.select('public_key')
		.eq('user_id', user.id)
		.single();

	console.log('[getUserEncryptionKey] Public key fetch result', {
		hasSecret: Boolean(secret),
		hasPublicKey: Boolean(secret?.public_key),
		publicKeyHexLength: secret?.public_key?.length,
		publicKeyHexPrefix: secret?.public_key?.slice(0, 16),
		errorMessage: secretError?.message
	});

	if (secretError || !secret?.public_key) {
		console.error('[getUserEncryptionKey] Failed to retrieve public encryption key', {
			userId: user.id,
			errorMessage: secretError?.message
		});
		throw new Error('Could not retrieve encryption key. Please set up your master key first.');
	}

	const publicKeyBytes = hexToBytes(secret.public_key);
	console.log('[getUserEncryptionKey] Returning encryption key', {
		userId: user.id,
		publicKeyByteLength: publicKeyBytes.length,
		publicKeyFirst16Bytes: Array.from(publicKeyBytes.slice(0, 16))
	});

	return {
		userId: user.id,
		publicKeyBytes
	};
}

interface EncryptionKeyRecipient {
	userId: string;
	publicKeyBytes: Uint8Array;
}

interface RecipientPublicKeyRow {
	user_id: string;
	public_key: string | null;
}

/**
 * Fetches public encryption keys for all users in a given team role
 * and all System Admin users. Returns an array of { userId, publicKeyBytes }.
 * Users without a set-up master password (no user_secrets entry) are skipped.
 */
export async function getTeamAndAdminEncryptionKeys(
	supabase: SupabaseClient,
	teamRole: string
): Promise<EncryptionKeyRecipient[]> {
	console.log('[getTeamAndAdminEncryptionKeys] Starting encryption key lookup', {
		teamRole
	});

	// Fetch user IDs for the selected team role and System Admins
	const { data: profiles, error: profileError } = await supabase
		.schema('api')
		.from('user_profiles')
		.select('user_id, role')
		.or(`role.eq.${teamRole},role.eq.System Admin`)
		.eq('is_active', true);

	console.log('[getTeamAndAdminEncryptionKeys] Profile fetch result', {
		hasProfiles: Boolean(profiles),
		profileCount: profiles?.length ?? 0,
		profileSample: profiles?.slice(0, 5),
		errorMessage: profileError?.message
	});

	if (profileError || !profiles) {
		console.error('Failed to fetch team/admin profiles:', profileError);
		return [];
	}

	if (profiles.length === 0) {
		console.log('[getTeamAndAdminEncryptionKeys] No profiles matched team/admin criteria', {
			teamRole
		});
		return [];
	}

	const userIds = profiles.map((p) => p.user_id);
	console.log('[getTeamAndAdminEncryptionKeys] Resolved user IDs', {
		count: userIds.length,
		userIds
	});

	// Fetch public keys via RPC (team + system admins) to avoid client-side RLS row loss
	const { data: secrets, error: secretsError } = await supabase
		.schema('api')
		.rpc('get_recipient_public_keys', {
			p_team_role: teamRole
		});

	const secretRows: RecipientPublicKeyRow[] = (secrets ?? []) as RecipientPublicKeyRow[];

	console.log('[getTeamAndAdminEncryptionKeys] Secret/key fetch result', {
		hasSecrets: Boolean(secrets),
		secretCount: secretRows.length,
		secretPreview: secretRows.slice(0, 5).map((secret) => ({
			user_id: secret.user_id,
			public_key_length: typeof secret.public_key === 'string' ? secret.public_key.length : 0,
			public_key_prefix:
				typeof secret.public_key === 'string' ? secret.public_key.slice(0, 16) : undefined
		})),
		errorMessage: secretsError?.message
	});

	if (secretsError || !secrets) {
		console.error('Failed to fetch team/admin encryption keys:', secretsError);
		return [];
	}

	const recipients = secretRows
		.filter((s) => s.public_key)
		.map((s) => ({
			userId: s.user_id as string,
			publicKeyBytes: hexToBytes(s.public_key as string)
		}));

	console.log('[getTeamAndAdminEncryptionKeys] Returning recipient encryption keys', {
		teamRole,
		recipientCount: recipients.length,
		recipientPreview: recipients.slice(0, 10).map((r) => ({
			userId: r.userId,
			publicKeyByteLength: r.publicKeyBytes.length,
			publicKeyFirst8Bytes: Array.from(r.publicKeyBytes.slice(0, 8))
		}))
	});

	return recipients;
}
