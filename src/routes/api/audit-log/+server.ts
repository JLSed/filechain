import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';
import type { AUDIT_EVENT_TYPES, SEVERITY_LEVELS } from '$lib/constants/SchemaData';

interface AuditLogRequestBody {
	details: string;
	eventType: (typeof AUDIT_EVENT_TYPES)[number];
	changes?: Record<string, { old: unknown; new: unknown }> | null;
	severityLevel?: (typeof SEVERITY_LEVELS)[number];
}

export const POST: RequestHandler = async ({
	request,
	locals: { supabase, safeGetSession },
	getClientAddress
}) => {
	const { session } = await safeGetSession();
	if (!session) throw error(401, 'Unauthorized');

	let body: AuditLogRequestBody;
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON body.');
	}

	if (!body.details || !body.eventType) {
		throw error(400, 'Missing required fields: details, eventType.');
	}

	// Capture IP address
	let ipAddress = getClientAddress();
	if (ipAddress === '::1') ipAddress = '127.0.0.1';

	// Fetch actor profile name
	const { data: profile } = await supabase
		.schema('api')
		.from('user_profiles')
		.select('first_name, middle_name, last_name')
		.eq('user_id', session.user.id)
		.single();

	const actorName = profile
		? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
		: (session.user.email ?? 'Unknown');

	// Replace [actor] placeholder in details with the actual name
	const details = body.details.replace('[actor]', actorName);

	await insertAuditLog(supabase, {
		actorId: session.user.id,
		details,
		changes: body.changes ?? null,
		severityLevel: body.severityLevel ?? 'notice',
		ipAddress,
		eventType: body.eventType
	});

	return json({ success: true });
};
