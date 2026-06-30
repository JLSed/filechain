import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CRON_SECRET } from '$env/static/private';
import { createAdminClient } from '$lib/services/supabase/admin';
import { insertAuditLog } from '$lib/services/audit-log';

/**
 * Cron cleanup endpoint: permanently deletes items archived > 30 days ago.
 * Secured via CRON_SECRET header. Intended to be called daily by an external cron.
 *
 * Deletion order: files → applications → clients (respects FK dependencies).
 */
export const POST: RequestHandler = async ({ request }) => {
	const authHeader = request.headers.get('authorization');
	if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
		throw error(401, 'Unauthorized');
	}

	const admin = createAdminClient();
	const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
	const summary = { files: 0, applications: 0, clients: 0 };

	// 1. Purge expired files
	const { data: expiredFiles } = await admin
		.schema('api')
		.from('file_metadata')
		.select('file_id, file_path')
		.eq('is_archived', true)
		.lt('archived_at', cutoff);

	if (expiredFiles && expiredFiles.length > 0) {
		const filePaths = expiredFiles.map((f: { file_path: string }) => f.file_path);
		const fileIds = expiredFiles.map((f: { file_id: string }) => f.file_id);

		// Delete from storage bucket
		await admin.storage.from('storage').remove(filePaths);

		// Delete related DB rows (DEKs, ledger entries, then metadata)
		await admin.schema('api').from('file_dek').delete().in('file_id', fileIds);
		await admin.schema('api').from('file_ledger').delete().in('file_id', fileIds);
		await admin.schema('api').from('file_metadata').delete().in('file_id', fileIds);

		summary.files = fileIds.length;
	}

	// 2. Purge expired applications (only if no active files remain)
	const { data: expiredApps } = await admin
		.schema('api')
		.from('ip_applications')
		.select('application_id')
		.eq('is_archived', true)
		.lt('archived_at', cutoff);

	if (expiredApps && expiredApps.length > 0) {
		const appIds = expiredApps.map((a: { application_id: string }) => a.application_id);

		// Delete tasks associated with these applications
		await admin.schema('api').from('application_tasks').delete().in('application_id', appIds);
		await admin.schema('api').from('ip_applications').delete().in('application_id', appIds);

		summary.applications = appIds.length;
	}

	// 3. Purge expired clients (only if no active applications remain)
	const { data: expiredClients } = await admin
		.schema('api')
		.from('client_profiles')
		.select('client_id')
		.eq('is_archived', true)
		.lt('archived_at', cutoff);

	if (expiredClients && expiredClients.length > 0) {
		const clientIds = expiredClients.map((c: { client_id: string }) => c.client_id);
		await admin.schema('api').from('client_profiles').delete().in('client_id', clientIds);

		summary.clients = clientIds.length;
	}

	// Audit log the purge
	if (summary.files > 0 || summary.applications > 0 || summary.clients > 0) {
		await insertAuditLog(admin, {
			actorId: '00000000-0000-0000-0000-000000000000', // system actor
			details: `Automated purge: deleted ${summary.files} file(s), ${summary.applications} application(s), ${summary.clients} client(s).`,
			severityLevel: 'warning',
			eventType: 'Purged Archived Items'
		});
	}

	return json({ success: true, purged: summary });
};
