import type { SupabaseClient } from '@supabase/supabase-js';
import type { AUDIT_EVENT_TYPES, SEVERITY_LEVELS } from '$lib/constants/SchemaData';

interface InsertAuditLogParams {
	actorId: string;
	details: string;
	changes?: Record<string, { old: unknown; new: unknown }> | null;
	severityLevel?: (typeof SEVERITY_LEVELS)[number];
	ipAddress?: string | null;
	eventType: (typeof AUDIT_EVENT_TYPES)[number];
}

/**
 * Inserts a new audit log entry into the `api.audit_logs` table.
 *
 * @param supabase - An authenticated Supabase client instance
 * @param params - The audit log entry details
 *
 * @example
 * ```typescript
 * await insertAuditLog(supabase, {
 *   actorId: session.user.id,
 *   details: 'J. P. Sedillo Edited Application 2029345345',
 *   changes: {
 *     status: { old: 'Client Intake', new: 'Filing' },
 *     fees: { old: 1500, new: 2000 },
 *     team_assigned: { old: 'TM Team', new: 'UM Team' }
 *   },
 *   severityLevel: 'notice',
 *   ipAddress: '127.0.0.1',
 *   eventType: 'Edited Application'
 * });
 * ```
 */
export async function insertAuditLog(
	supabase: SupabaseClient,
	params: InsertAuditLogParams
): Promise<void> {
	const { error } = await supabase
		.schema('api')
		.from('audit_logs')
		.insert({
			actor_id: params.actorId,
			details: params.details,
			changes: params.changes ?? null,
			severity_level: params.severityLevel ?? 'neutral',
			ip_address: params.ipAddress ?? null,
			event_type: params.eventType
		});

	if (error) {
		console.error('Failed to insert audit log:', error);
	}
}
