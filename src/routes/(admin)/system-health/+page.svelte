<script lang="ts">
	import { invalidate } from '$app/navigation';
	import {
		RefreshCw,
		Database,
		Activity,
		Globe,
		Server,
		Wifi,
		CircleCheck,
		CircleAlert,
		CircleX,
		CircleHelp,
		Gauge
	} from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { Progress } from '$lib/shadcn/components/ui/progress/index.js';

	interface StatusComponent {
		id: string;
		name: string;
		status: string;
	}

	let { data } = $props();
	let isRefreshing = $state(false);

	// ── Client-side ping state ──
	let pingResults = $state<number[]>([]);
	let isPinging = $state(false);
	let pingError = $state<string | null>(null);

	const avgPing = $derived(
		pingResults.length > 0
			? Math.round(pingResults.reduce((a, b) => a + b, 0) / pingResults.length)
			: null
	);
	const minPing = $derived(pingResults.length > 0 ? Math.min(...pingResults) : null);
	const maxPing = $derived(pingResults.length > 0 ? Math.max(...pingResults) : null);

	function statusIcon(status: string) {
		if (status === 'online') return CircleCheck;
		if (status === 'degraded') return CircleAlert;
		if (status === 'offline') return CircleX;
		return CircleHelp;
	}

	function statusColor(status: string) {
		if (status === 'online') return 'text-emerald-600 dark:text-emerald-400';
		if (status === 'degraded') return 'text-amber-600 dark:text-amber-400';
		if (status === 'offline') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function statusBg(status: string) {
		if (status === 'online') return 'bg-emerald-500/10 border-emerald-500/20';
		if (status === 'degraded') return 'bg-amber-500/10 border-amber-500/20';
		if (status === 'offline') return 'bg-destructive/10 border-destructive/20';
		return 'bg-muted border-border';
	}

	/**
	 * Maps Atlassian Statuspage indicator values to visual styles.
	 * 'none' = all good, 'minor'/'major'/'critical' = various levels.
	 */
	function platformIndicatorColor(indicator: string) {
		if (indicator === 'none') return 'text-emerald-600 dark:text-emerald-400';
		if (indicator === 'minor') return 'text-amber-600 dark:text-amber-400';
		if (indicator === 'major' || indicator === 'critical') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function platformIndicatorBg(indicator: string) {
		if (indicator === 'none') return 'bg-emerald-500/10 border-emerald-500/20';
		if (indicator === 'minor') return 'bg-amber-500/10 border-amber-500/20';
		if (indicator === 'major' || indicator === 'critical')
			return 'bg-destructive/10 border-destructive/20';
		return 'bg-muted border-border';
	}

	function platformIcon(indicator: string) {
		if (indicator === 'none') return CircleCheck;
		if (indicator === 'minor') return CircleAlert;
		if (indicator === 'major' || indicator === 'critical') return CircleX;
		return CircleHelp;
	}

	function componentStatusColor(status: string) {
		if (status === 'operational') return 'text-emerald-600 dark:text-emerald-400';
		if (status === 'degraded_performance' || status === 'partial_outage')
			return 'text-amber-600 dark:text-amber-400';
		if (status === 'major_outage') return 'text-destructive';
		return 'text-muted-foreground';
	}

	function componentStatusDot(status: string) {
		if (status === 'operational') return 'bg-emerald-500';
		if (status === 'degraded_performance' || status === 'partial_outage') return 'bg-amber-500';
		if (status === 'major_outage') return 'bg-destructive';
		return 'bg-muted-foreground';
	}

	function componentStatusLabel(status: string) {
		if (status === 'operational') return 'Operational';
		if (status === 'degraded_performance') return 'Degraded';
		if (status === 'partial_outage') return 'Partial Outage';
		if (status === 'major_outage') return 'Major Outage';
		if (status === 'under_maintenance') return 'Maintenance';
		return status.replace(/_/g, ' ');
	}

	const vercelCoreIds = [
		'fk66q26xp7hh',
		'7ckq6xr6nsbv',
		'rxynwj392p81',
		'kgcsn9c73xzf',
		'zr2j7y9kv5hd',
		'3fm17p8bsb40'
	];
	const supabaseCoreIds = [
		'yz6pcnlscwpb',
		'fznyj00kpng2',
		'f867wqkvs7ct',
		'mvs609wqrsf7',
		'l3gnd4rfxc2y',
		'43453sylqk7v',
		'022jctfqtj3y'
	];

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
	}

	function latencyLabel(ms: number): string {
		if (ms < 50) return 'Excellent';
		if (ms < 150) return 'Good';
		if (ms < 300) return 'Fair';
		return 'Slow';
	}

	function latencyColor(ms: number): string {
		if (ms < 50) return 'text-emerald-600 dark:text-emerald-400';
		if (ms < 150) return 'text-chart-2';
		if (ms < 300) return 'text-amber-600 dark:text-amber-400';
		return 'text-destructive';
	}

	async function handleRefresh() {
		isRefreshing = true;
		await invalidate('db:system-health');
		setTimeout(() => {
			isRefreshing = false;
		}, 600);
	}

	async function runPingTest() {
		isPinging = true;
		pingError = null;
		pingResults = [];

		try {
			for (let i = 0; i < 5; i++) {
				const start = performance.now();
				const res = await fetch('/api/ping', { cache: 'no-store' });
				if (!res.ok) throw new Error(`HTTP ${res.status}`);
				const elapsed = Math.round(performance.now() - start);
				pingResults = [...pingResults, elapsed];
				// Small gap between pings
				if (i < 4) await new Promise((r) => setTimeout(r, 200));
			}
		} catch (err: unknown) {
			pingError = err instanceof Error ? err.message : 'Ping failed';
		} finally {
			isPinging = false;
		}
	}

	const db = $derived(data.systemHealth.database);
	const platforms = $derived(data.systemHealth.platforms);
	const runtime = $derived(data.systemHealth.runtime);

	const DB_LIMIT_BYTES = 500 * 1024 * 1024; // 500 MB DB Limit
	const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB Storage Limit
	const COMBINED_LIMIT_BYTES = DB_LIMIT_BYTES + STORAGE_LIMIT_BYTES; // 1.5 GB Combined Limit

	const usedDbBytes = $derived(db?.metrics?.db_size_bytes ?? 0);
	const usedStorageBytes = $derived(db?.storage?.storage_size_bytes ?? 0);
	const totalUsedBytes = $derived(usedDbBytes + usedStorageBytes);

	const storageUtilizationPercentage = $derived(
		totalUsedBytes > 0
			? Math.max(0.1, Number(((totalUsedBytes / COMBINED_LIMIT_BYTES) * 100).toFixed(1)))
			: 0
	);
</script>

<div class="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">System Health</h1>
			<p class="text-sm text-muted-foreground">Live infrastructure status and diagnostics</p>
		</div>
		<Button
			variant="outline"
			size="sm"
			class="gap-2"
			onclick={handleRefresh}
			disabled={isRefreshing}
		>
			<RefreshCw class="size-4! {isRefreshing ? 'animate-spin' : ''}" />
			{isRefreshing ? 'Refreshing...' : 'Refresh'}
		</Button>
	</div>

	<!-- Database Health -->
	<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
		<Card.Header>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Database class="size-5! text-muted-foreground" />
					<Card.Title class="text-base">Database</Card.Title>
				</div>
				<div class="flex items-center gap-2">
					<Badge variant="outline" class="{statusBg(db.status)} {statusColor(db.status)} gap-1.5">
						{@const Icon = statusIcon(db.status)}
						<Icon class="size-3.5!" />
						{db.status === 'online'
							? 'Connected'
							: db.status === 'degraded'
								? 'Degraded'
								: 'Offline'}
					</Badge>
				</div>
			</div>
			<Card.Description>
				{#if db.error}
					{db.error}
				{:else}
					Supabase PostgreSQL — Query latency {db.latencyMs}ms
				{/if}
			</Card.Description>
		</Card.Header>

		{#if db.metrics}
			<Card.Content>
				<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					<!-- DB Size -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Database Size</span>
						<span class="text-xl font-semibold tabular-nums">
							{formatBytes(db.metrics.db_size_bytes ?? 0)}
						</span>
					</div>

					<!-- Storage Size -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Storage Size</span>
						<span class="text-xl font-semibold tabular-nums">
							{formatBytes(db.storage?.storage_size_bytes ?? 0)} / {formatBytes(
								STORAGE_LIMIT_BYTES
							)}
						</span>
					</div>

					<!-- Storage Utilization -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Storage Utilization</span>
						<div class="flex items-end justify-between">
							<span class="text-xl font-semibold tabular-nums">
								{storageUtilizationPercentage}%
							</span>
							<span class="mb-0.5 text-[10px] text-muted-foreground tabular-nums">
								{formatBytes(totalUsedBytes)} / {formatBytes(COMBINED_LIMIT_BYTES)}
							</span>
						</div>
						<Progress value={storageUtilizationPercentage} max={100} class="h-1.5" />
					</div>

					<!-- Total Files Stored -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Total Files Stored</span>
						<span class="text-xl font-semibold tabular-nums">
							{db.storage?.total_files_count ?? 0}
						</span>
					</div>

					<!-- Active Connections -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Active Connections</span>
						<span class="text-xl font-semibold tabular-nums">
							{db.metrics.active_connections ?? 0}
						</span>
					</div>

					<!-- Cache Hit Ratio -->
					<div class="flex flex-col gap-1.5 rounded-lg border p-3">
						<span class="text-xs font-medium text-muted-foreground">Cache Hit Ratio</span>
						<div class="flex items-center gap-2">
							<span class="text-xl font-semibold tabular-nums">
								{db.metrics.cache_hit_ratio ?? 0}%
							</span>
						</div>
						<Progress value={db.metrics.cache_hit_ratio ?? 0} max={100} class="h-1.5" />
					</div>
				</div>
			</Card.Content>
		{/if}

		{#if db.latencyMs > 0}
			<Card.Footer class="pt-0">
				<div class="flex items-center gap-2 text-sm">
					<Gauge class="size-4! text-muted-foreground" />
					<span class="text-muted-foreground">Server → DB latency:</span>
					<span class="font-medium tabular-nums {latencyColor(db.latencyMs)}">
						{db.latencyMs}ms
					</span>
					<Badge variant="outline" class="text-xs {latencyColor(db.latencyMs)}">
						{latencyLabel(db.latencyMs)}
					</Badge>
				</div>
			</Card.Footer>
		{/if}
	</Card.Root>

	<!-- Platform Status -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- Vercel -->
		<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Globe class="size-5! text-muted-foreground" />
						<Card.Title class="text-base">Vercel</Card.Title>
					</div>
					<Badge
						variant="outline"
						class="{platformIndicatorBg(platforms.vercel.indicator)} {platformIndicatorColor(
							platforms.vercel.indicator
						)} gap-1.5"
					>
						{@const VIcon = platformIcon(platforms.vercel.indicator)}
						<VIcon class="size-3.5!" />
						{platforms.vercel.status}
					</Badge>
				</div>
				<Card.Description>Hosting & Edge Network</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col gap-2.5 divide-y divide-border/50 text-sm">
					{#each platforms.vercel.components.filter( (c: StatusComponent) => vercelCoreIds.includes(c.id) ) as component (component.id)}
						<div class="flex items-center justify-between pt-2.5 first:pt-0">
							<span class="text-muted-foreground">{component.name}</span>
							<div
								class="flex items-center gap-1.5 font-medium {componentStatusColor(
									component.status
								)}"
							>
								<span
									class="inline-block size-1.5 rounded-full {componentStatusDot(component.status)}"
								></span>
								<span class="text-xs">{componentStatusLabel(component.status)}</span>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>

		<!-- Supabase -->
		<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
			<Card.Header class="pb-3">
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-2">
						<Database class="size-5! text-muted-foreground" />
						<Card.Title class="text-base">Supabase</Card.Title>
					</div>
					<Badge
						variant="outline"
						class="{platformIndicatorBg(platforms.supabase.indicator)} {platformIndicatorColor(
							platforms.supabase.indicator
						)} gap-1.5"
					>
						{@const SIcon = platformIcon(platforms.supabase.indicator)}
						<SIcon class="size-3.5!" />
						{platforms.supabase.status}
					</Badge>
				</div>
				<Card.Description>Database, Auth & Storage</Card.Description>
			</Card.Header>
			<Card.Content>
				<div class="flex flex-col gap-2.5 divide-y divide-border/50 text-sm">
					{#each platforms.supabase.components.filter( (c: StatusComponent) => supabaseCoreIds.includes(c.id) ) as component (component.id)}
						<div class="flex items-center justify-between pt-2.5 first:pt-0">
							<span class="text-muted-foreground">{component.name}</span>
							<div
								class="flex items-center gap-1.5 font-medium {componentStatusColor(
									component.status
								)}"
							>
								<span
									class="inline-block size-1.5 rounded-full {componentStatusDot(component.status)}"
								></span>
								<span class="text-xs">{componentStatusLabel(component.status)}</span>
							</div>
						</div>
					{/each}
				</div>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- API Ping Test -->
	<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
		<Card.Header>
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2">
					<Wifi class="size-5! text-muted-foreground" />
					<Card.Title class="text-base">API Latency Test</Card.Title>
				</div>
				<Button
					variant="outline"
					size="sm"
					class="gap-2"
					onclick={runPingTest}
					disabled={isPinging}
				>
					<Activity class="size-4! {isPinging ? 'animate-pulse' : ''}" />
					{isPinging ? 'Pinging...' : 'Run Ping Test'}
				</Button>
			</div>
			<Card.Description>
				Measures browser → SvelteKit server round-trip time (5 requests)
			</Card.Description>
		</Card.Header>

		{#if pingResults.length > 0 || pingError}
			<Card.Content>
				{#if pingError}
					<div class="flex items-center gap-2 text-sm text-destructive">
						<CircleX class="size-4!" />
						{pingError}
					</div>
				{:else}
					<!-- Ping results visualization -->
					<div class="flex flex-col gap-4">
						<!-- Summary stats -->
						<div class="grid grid-cols-3 gap-4">
							<div class="flex flex-col gap-1 rounded-lg border p-3">
								<span class="text-xs font-medium text-muted-foreground">Average</span>
								<span class="text-xl font-semibold tabular-nums {latencyColor(avgPing ?? 0)}">
									{avgPing}ms
								</span>
							</div>
							<div class="flex flex-col gap-1 rounded-lg border p-3">
								<span class="text-xs font-medium text-muted-foreground">Min</span>
								<span class="text-xl font-semibold tabular-nums {latencyColor(minPing ?? 0)}">
									{minPing}ms
								</span>
							</div>
							<div class="flex flex-col gap-1 rounded-lg border p-3">
								<span class="text-xs font-medium text-muted-foreground">Max</span>
								<span class="text-xl font-semibold tabular-nums {latencyColor(maxPing ?? 0)}">
									{maxPing}ms
								</span>
							</div>
						</div>

						<!-- Individual ping bars -->
						<div class="flex items-end gap-1.5">
							{#each pingResults as ms, i (i)}
								{@const maxVal = Math.max(...pingResults, 1)}
								{@const heightPct = Math.max((ms / maxVal) * 100, 8)}
								<div class="flex flex-1 flex-col items-center gap-1">
									<span class="text-xs text-muted-foreground tabular-nums">{ms}ms</span>
									<div
										class="w-full rounded-t-sm transition-all duration-300 {ms < 50
											? 'bg-emerald-500/70'
											: ms < 150
												? 'bg-chart-2/70'
												: ms < 300
													? 'bg-amber-500/70'
													: 'bg-destructive/70'}"
										style="height: {heightPct}px; min-height: 8px;"
									></div>
									<span class="text-[10px] text-muted-foreground">#{i + 1}</span>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</Card.Content>
		{/if}
	</Card.Root>

	<!-- Runtime Info -->
	<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
		<Card.Header>
			<div class="flex items-center gap-2">
				<Server class="size-5! text-muted-foreground" />
				<Card.Title class="text-base">Runtime</Card.Title>
			</div>
			<Card.Description>SvelteKit server environment details</Card.Description>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-medium text-muted-foreground">Environment</span>
					<Badge variant="outline" class="w-fit capitalize">{runtime.env}</Badge>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-medium text-muted-foreground">Region</span>
					<span class="text-sm font-medium">{runtime.region}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-medium text-muted-foreground">Node.js</span>
					<span class="font-mono text-sm">{runtime.nodeVersion}</span>
				</div>
				<div class="flex flex-col gap-0.5">
					<span class="text-xs font-medium text-muted-foreground">Git Commit</span>
					<span class="font-mono text-sm">{runtime.commitSha}</span>
				</div>
			</div>
		</Card.Content>
	</Card.Root>
</div>
