import type { SupabaseClient } from '@supabase/supabase-js';
import type { IpApplicationFormData } from '$lib/types/FormTypes';
import initWasm from '$lib/pkg/rust';
import { getUserEncryptionKey, getTeamAndAdminEncryptionKeys } from '$lib/utils/crypto';
import { encryptAndUploadFile } from '$lib/utils/file-upload';
import { insertAuditLog } from '$lib/services/audit-log';
import { insertNotificationBatch } from '$lib/services/notification';

/**
 * Submits an IP application:
 * 1. Encrypts each staged file client-side via WASM (AES-256-GCM hybrid encryption)
 *    for the uploader, all team members, and all System Admins.
 * 2. Uploads encrypted blobs to the `storage` bucket at `files/{application_number}/`.
 * 3. Inserts the client profile row.
 * 4. Inserts the application row into `ip_applications` with `link_to_folder` pointing to
 *    the storage directory and `team_assigned` for visibility control.
 * 5. Logs an audit entry for the submission.
 */
export async function submitIpApplication(
	formData: IpApplicationFormData,
	supabase: SupabaseClient,
	actorId: string,
	actorName: string
): Promise<void> {
	const appNumber = formData.application.application_number.trim();
	if (!appNumber) {
		throw new Error('Application number is required.');
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

	const storagePath = `files/${appNumber}`;

	// Encrypt and upload each file
	for (const staged of formData.files) {
		await encryptAndUploadFile({
			supabase,
			file: staged.file,
			category: staged.category,
			storagePath,
			uploaderId: userId,
			recipients: allRecipients,
			applicationNumber: appNumber
		});
	}

	// Resolve client ID — reuse existing or insert new
	let clientId: string;

	if (formData.client_profiles.client_id) {
		clientId = formData.client_profiles.client_id;
	} else {
		const { data: clientProfile, error: clientError } = await supabase
			.schema('api')
			.from('client_profiles')
			.insert({
				first_name: formData.client_profiles.first_name.trim(),
				middle_name: formData.client_profiles.middle_name.trim() || null,
				last_name: formData.client_profiles.last_name.trim(),
				email: formData.client_profiles.email.trim() || null,
				mobile_number: formData.client_profiles.mobile_number || null,
				nationality: formData.client_profiles.nationality.trim() || null,
				company_name: formData.client_profiles.company_name.trim() || null,
				company_address: formData.client_profiles.company_address.trim() || null
			})
			.select('client_id')
			.single();

		if (clientError || !clientProfile) {
			throw new Error(`Failed to save client profile: ${clientError?.message}`);
		}

		clientId = clientProfile.client_id;
	}

	// Insert the IP application
	const { error: insertError } = await supabase
		.schema('api')
		.from('ip_applications')
		.insert({
			application_number: appNumber,
			client_id: clientId,
			title_of_invention: formData.application.title_of_invention.trim(),
			type_of_invention_id: formData.application.type_of_invention_id,
			pre_protection_status_id: formData.application.pre_protection_status_id || null,
			type_of_office_action_id: formData.application.type_of_office_action_id || null,
			status: formData.application.status,
			filling_date: formData.application.filling_date || null,
			paper_document_no: formData.application.paper_document_no || null,
			fees: formData.application.fees,
			deadline: formData.application.deadline || null,
			mailing_date: formData.application.mailing_date || null,
			publication_date: formData.application.publication_date || null,
			inventor_names: formData.application.inventor_names,
			contact_details: formData.application.contact_details || null,
			link_to_folder: storagePath,
			remarks: formData.application.remarks || null,
			team_assigned: formData.application.team_assigned
		});

	if (insertError) {
		throw new Error(`Failed to save application: ${insertError.message}`);
	}

	// Log audit entry for the submission
	await insertAuditLog(supabase, {
		actorId,
		details: `${actorName} Submitted Application ${appNumber}`,
		severityLevel: 'notice',
		eventType: 'Submitted Application'
	});

	// Notify team members and System Admins
	try {
		const { data: teamMembers } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('user_id')
			.or(`role.eq.${teamRole},role.eq.System Admin`)
			.neq('user_id', actorId);

		if (teamMembers && teamMembers.length > 0) {
			const recipientIds = teamMembers.map((m: { user_id: string }) => m.user_id);
			await insertNotificationBatch(supabase, recipientIds, {
				actorId,
				title: 'New Application Assigned',
				message: `${actorName} assigned your team for application ${appNumber}`,
				link: `/application/${appNumber}`
			});
		}
	} catch (notifError) {
		console.error('Failed to send notifications:', notifError);
	}
}
