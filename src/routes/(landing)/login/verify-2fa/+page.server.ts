import type { PageServerLoad, Actions } from './$types';
import { redirect, fail } from '@sveltejs/kit';
import { insertAuditLog } from '$lib/services/audit-log';
import { formatName } from '$lib/utils/formatter';

export const load = (async ({ locals: { supabase, safeGetSession } }) => {
	const { session } = await safeGetSession();
	if (!session) redirect(303, '/login');

	// Get assurance level — if already aal2, go to dashboard
	const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
	if (aalData?.currentLevel === 'aal2') redirect(303, '/dashboard');

	// Must have at least one verified factor to be on this page
	const { data: factorsData } = await supabase.auth.mfa.listFactors();
	const verifiedTotps = factorsData?.totp?.filter((f) => f.status === 'verified') ?? [];
	if (verifiedTotps.length === 0) redirect(303, '/login/setup-2fa');

	return {
		factorId: verifiedTotps[0].id
	};
}) satisfies PageServerLoad;

export const actions = {
	verify: async ({ request, locals: { supabase, safeGetSession }, getClientAddress }) => {
		const { session } = await safeGetSession();
		if (!session) return fail(401, { error: 'Session expired. Please log in again.' });

		const formData = await request.formData();
		const code = formData.get('code')?.toString().trim() ?? '';
		const factorId = formData.get('factorId')?.toString() ?? '';

		if (!code || code.length !== 6) {
			return fail(400, { error: 'Please enter a valid 6-digit code.' });
		}

		const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
			factorId
		});

		if (challengeError || !challengeData) {
			console.error('MFA challenge error:', challengeError);
			return fail(500, { error: 'Failed to create MFA challenge. Please try again.' });
		}

		const { error: verifyError } = await supabase.auth.mfa.verify({
			factorId,
			challengeId: challengeData.id,
			code
		});

		if (verifyError) {
			return fail(400, { error: 'Invalid code. Please check and try again.' });
		}

		// Audit log for 2FA login verification
		let ipAddress = getClientAddress();
		if (ipAddress === '::1') ipAddress = '127.0.0.1';

		const { data: profile } = await supabase
			.schema('api')
			.from('user_profiles')
			.select('first_name, middle_name, last_name')
			.eq('user_id', session.user.id)
			.single();

		const actorName = profile
			? formatName(profile.first_name ?? '', profile.middle_name, profile.last_name ?? '')
			: (session.user.email ?? 'Unknown');

		await insertAuditLog(supabase, {
			actorId: session.user.id,
			details: `${actorName} Logged In (2FA Verified)`,
			severityLevel: 'notice',
			ipAddress,
			eventType: 'Logged In'
		});

		redirect(303, '/dashboard');
	}
} satisfies Actions;
