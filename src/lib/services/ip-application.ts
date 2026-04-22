import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpApplicationFormData } from '$lib/types/FormTypes';
import initWasm from '$lib/pkg/rust';
import { getUserEncryptionKey, getTeamAndAdminEncryptionKeys } from '$lib/utils/crypto';
import { encryptAndUploadFile } from '$lib/utils/file-upload';

/**
 * Encrypts and uploads an IP application's files:
 * 1. Encrypts each staged file client-side via WASM (AES-256-GCM hybrid encryption)
 *    for the uploader, all team members, and all System Admins.
 * 2. Uploads encrypted blobs to the `storage` bucket at `files/{application_id}/`.
 */
export async function uploadApplicationFiles(
	formData: IpApplicationFormData,
	supabase: SupabaseClient,
	applicationId: string
): Promise<void> {
	const storagePath = `files/${applicationId}`;

	if (!formData.files || formData.files.length === 0) {
		return;
	}

	// Ensure WASM module is initialised
	await initWasm();

	// Resolve the user's public key for encryption
	const { userId, publicKeyBytes } = await getUserEncryptionKey(supabase);

	// Collect all recipients: uploader + team members + system admins
	const teamRole = formData.application.team_assigned;
	const teamAndAdminKeys = await getTeamAndAdminEncryptionKeys(supabase, teamRole);

	// Build array of all recipients, starting with the uploader
	const allRecipients: Array<{ userId: string; publicKeyBytes: Uint8Array }> = [
		{ userId, publicKeyBytes }
	];

	// Add team + admin keys, avoiding duplicates with the uploader
	for (const recipient of teamAndAdminKeys) {
		if (recipient.userId !== userId) {
			allRecipients.push(recipient);
		}
	}

	// Encrypt and upload each file
	for (const staged of formData.files) {
		await encryptAndUploadFile({
			supabase,
			file: staged.file,
			category: staged.category,
			storagePath,
			uploaderId: userId,
			recipients: allRecipients,
			applicationNumber: applicationId
		});
	}
}
