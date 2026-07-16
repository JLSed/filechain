import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

/**
 * Loads the last 50 backup log entries from the database.
 */
export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) {
		throw error(401, 'Unauthorized');
	}

	const { data: logs, error: queryError } = await supabase
		.schema('api')
		.from('backup_logs')
		.select('*')
		.order('created_at', { ascending: false })
		.limit(50);

	if (queryError) {
		console.error('Error loading backup logs:', queryError);
		throw error(500, 'Unable to load backup history.');
	}

	return { logs };
};

export const actions: Actions = {
	/**
	 * Triggers a manual backup by registering a DB log and calling GitHub's Actions API.
	 */
	triggerBackup: async ({ locals: { supabase, safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		// 1. Rate Limiting: Check if a backup is currently pending/running in the last 15 minutes
		const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
		const { data: activeBackups, error: activeCheckError } = await supabase
			.schema('api')
			.from('backup_logs')
			.select('id')
			.in('status', ['pending', 'running'])
			.gt('created_at', fifteenMinutesAgo);

		if (activeCheckError) {
			console.error('Active backup check error:', activeCheckError);
		}

		if (activeBackups && activeBackups.length > 0) {
			return fail(429, {
				message: 'A backup job is already in progress or was recently triggered. Please wait.'
			});
		}

		// 2. Register "pending" backup log entry in the database
		const { data: logEntry, error: dbError } = await supabase
			.schema('api')
			.from('backup_logs')
			.insert({
				backup_type: 'manual',
				status: 'pending',
				triggered_by: session.user.id
			})
			.select()
			.single();

		if (dbError || !logEntry) {
			console.error('Failed to create backup log entry:', dbError);
			return fail(500, { message: 'Failed to initialize database log entry.' });
		}

		// 3. Dispatch GitHub Actions workflow
		try {
			const repoOwner = env.GITHUB_REPO_OWNER;
			const repoName = env.GITHUB_REPO_NAME;
			const workflowId = 'backup.yml';
			const pat = env.GITHUB_PAT;

			if (!repoOwner || !repoName || !pat) {
				throw new Error(
					'Missing GITHUB_REPO_OWNER, GITHUB_REPO_NAME, or GITHUB_PAT env configurations.'
				);
			}

			const response = await fetch(
				`https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`,
				{
					method: 'POST',
					headers: {
						Accept: 'application/vnd.github+json',
						Authorization: `Bearer ${pat}`,
						'X-GitHub-Api-Version': '2022-11-28',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ref: 'main',
						inputs: {
							log_id: logEntry.id
						}
					})
				}
			);

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`GitHub API returned ${response.status}: ${errText}`);
			}

			return { success: true };
		} catch (err: unknown) {
			console.error('Failed to dispatch GitHub backup workflow:', err);

			// Revert log status in DB to failed
			await supabase
				.schema('api')
				.from('backup_logs')
				.update({
					status: 'failed',
					error_message: err instanceof Error ? err.message : 'GitHub trigger failed',
					completed_at: new Date().toISOString()
				})
				.eq('id', logEntry.id);

			return fail(500, {
				message: err instanceof Error ? err.message : 'Failed to initiate backup execution.'
			});
		}
	},

	/**
	 * Triggers a point-in-time recovery restore by invoking the GitHub Action recovery workflow.
	 */
	triggerRecovery: async ({ request, locals: { safeGetSession } }) => {
		const { session } = await safeGetSession();
		if (!session) {
			return fail(401, { message: 'Unauthorized' });
		}

		const formData = await request.formData();
		const backupFolder = formData.get('backupFolder') as string;

		if (!backupFolder) {
			return fail(400, { message: 'A valid backup selection is required for recovery.' });
		}

		try {
			const repoOwner = env.GITHUB_REPO_OWNER;
			const repoName = env.GITHUB_REPO_NAME;
			const workflowId = 'restore.yml';
			const pat = env.GITHUB_PAT;

			if (!repoOwner || !repoName || !pat) {
				throw new Error(
					'Missing GITHUB_REPO_OWNER, GITHUB_REPO_NAME, or GITHUB_PAT env configurations.'
				);
			}

			const response = await fetch(
				`https://api.github.com/repos/${repoOwner}/${repoName}/actions/workflows/${workflowId}/dispatches`,
				{
					method: 'POST',
					headers: {
						Accept: 'application/vnd.github+json',
						Authorization: `Bearer ${pat}`,
						'X-GitHub-Api-Version': '2022-11-28',
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({
						ref: 'main',
						inputs: {
							backup_folder: backupFolder
						}
					})
				}
			);

			if (!response.ok) {
				const errText = await response.text();
				throw new Error(`GitHub API returned ${response.status}: ${errText}`);
			}

			return { success: true };
		} catch (err: unknown) {
			console.error('Failed to trigger restore workflow:', err);
			return fail(500, {
				message: err instanceof Error ? err.message : 'Failed to initiate system recovery.'
			});
		}
	}
};
