import type { AUDIT_EVENT_TYPES, SEVERITY_LEVELS } from '$lib/constants/SchemaData';

interface LogAuditEventParams {
	details: string;
	eventType: (typeof AUDIT_EVENT_TYPES)[number];
	changes?: Record<string, { old: unknown; new: unknown }> | null;
	severityLevel?: (typeof SEVERITY_LEVELS)[number];
}

/**
 * Sends an audit log entry to the server-side API endpoint.
 * The server captures the client IP address and resolves the actor name.
 *
 * Use `[actor]` as a placeholder in `details` — the server will replace it
 * with the authenticated user's full name.
 *
 * @example
 * ```typescript
 * await logAuditEvent({
 *   details: '[actor] added file "document.pdf" to application APP-001',
 *   eventType: 'Added File'
 * });
 * ```
 */
export async function logAuditEvent(params: LogAuditEventParams): Promise<void> {
	try {
		const response = await fetch('/api/audit-log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				details: params.details,
				eventType: params.eventType,
				changes: params.changes ?? null,
				severityLevel: params.severityLevel ?? 'notice'
			})
		});

		if (!response.ok) {
			console.error('Audit log failed:', response.status, await response.text());
		}
	} catch (err) {
		// Fire-and-forget: never block the main operation for audit logging
		console.error('Failed to send audit log:', err);
	}
}
