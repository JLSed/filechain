import type { SupabaseClient } from '@supabase/supabase-js';

interface InsertNotificationParams {
	userId: string;
	actorId: string;
	title: string;
	message: string;
	link?: string | null;
}

/**
 * Inserts a new notification entry into the `api.notifications` table.
 *
 * @param supabase - An authenticated Supabase client instance
 * @param params - The notification entry details
 *
 * @example
 * ```typescript
 * await insertNotification(supabase, {
 *   userId: recipientId,
 *   actorId: session.user.id,
 *   title: 'New Application Submitted',
 *   message: 'J. P. Sedillo submitted application 20290001',
 *   link: '/application/20290001'
 * });
 * ```
 */
export async function insertNotification(
	supabase: SupabaseClient,
	params: InsertNotificationParams
): Promise<void> {
	const { error } = await supabase
		.schema('api')
		.from('notifications')
		.insert({
			user_id: params.userId,
			actor_id: params.actorId,
			title: params.title,
			message: params.message,
			link: params.link ?? null
		});

	if (error) {
		console.error('Failed to insert notification:', error);
	}
}

/**
 * Inserts notifications for multiple recipients in a single batch.
 *
 * @param supabase - An authenticated Supabase client instance
 * @param recipientIds - Array of user IDs to notify
 * @param params - Shared notification details (actorId, title, message, link)
 */
export async function insertNotificationBatch(
	supabase: SupabaseClient,
	recipientIds: string[],
	params: Omit<InsertNotificationParams, 'userId'>
): Promise<void> {
	if (recipientIds.length === 0) return;

	const rows = recipientIds.map((userId) => ({
		user_id: userId,
		actor_id: params.actorId,
		title: params.title,
		message: params.message,
		link: params.link ?? null
	}));

	const { error } = await supabase.schema('api').from('notifications').insert(rows);

	if (error) {
		console.error('Failed to insert notification batch:', error);
	}
}
