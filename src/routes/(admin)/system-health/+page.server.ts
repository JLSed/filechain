import type { PageServerLoad } from './$types';
import { createAdminClient } from '$lib/services/supabase/admin';
import { dev } from '$app/environment';

export const load = (async ({ depends }) => {
	depends('db:system-health');

	const startDb = performance.now();
	let dbStatus: string;
	let dbLatencyMs = 0;
	let dbMetrics: {
		db_size_bytes?: number;
		active_connections?: number;
		cache_hit_ratio?: number;
	} | null = null;
	let storageMetrics: {
		storage_size_bytes?: number;
		total_files_count?: number;
	} | null = null;
	let dbError: string | null = null;

	try {
		const adminClient = createAdminClient();
		const [metricsResult, storageResult] = await Promise.all([
			adminClient.schema('api').rpc('get_system_metrics'),
			adminClient.schema('api').rpc('get_storage_metrics')
		]);
		dbLatencyMs = Math.round(performance.now() - startDb);

		const { data, error } = metricsResult;
		const { data: storageData, error: storageError } = storageResult;

		if (error || storageError) {
			dbError = error?.message || storageError?.message || 'Failed to fetch metrics';
			// Fallback: if rpc fails, at least check connectivity
			const { error: pingError } = await adminClient
				.schema('api')
				.from('permissions')
				.select('permission_id')
				.limit(1);
			dbStatus = pingError ? 'offline' : 'degraded';
		} else {
			dbStatus = 'online';
			dbMetrics = data;
			storageMetrics = storageData;
		}
	} catch (err: unknown) {
		dbStatus = 'offline';
		dbError = err instanceof Error ? err.message : 'Failed to connect to database';
	}

	// ponytail: Atlassian Statuspage v2 API is a public standard used by both Vercel and Supabase.
	// If either provider changes their status page URL, only these constants need updating.
	const fetchStatusPage = async (url: string) => {
		const controller = new AbortController();
		const id = setTimeout(() => controller.abort(), 2000);
		try {
			const res = await fetch(url, { signal: controller.signal });
			clearTimeout(id);
			if (res.ok) {
				const json = await res.json();
				return {
					status: json.status?.description || 'Unknown',
					indicator: json.status?.indicator || 'unknown',
					components: json.components || []
				};
			}
		} catch {
			clearTimeout(id);
		}
		return { status: 'Unable to reach status provider', indicator: 'unknown', components: [] };
	};

	const [vercelStatus, supabaseStatus] = await Promise.all([
		fetchStatusPage('https://www.vercel-status.com/api/v2/summary.json'),
		fetchStatusPage('https://status.supabase.com/api/v2/summary.json')
	]);

	return {
		systemHealth: {
			database: {
				status: dbStatus,
				latencyMs: dbLatencyMs,
				metrics: dbMetrics,
				storage: storageMetrics,
				error: dbError
			},
			platforms: {
				vercel: vercelStatus,
				supabase: supabaseStatus
			},
			runtime: {
				nodeVersion: process.version,
				env: dev ? 'development' : process.env.VERCEL_ENV || 'production',
				region: process.env.VERCEL_REGION || 'local',
				commitSha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'local-dev'
			}
		}
	};
}) satisfies PageServerLoad;
