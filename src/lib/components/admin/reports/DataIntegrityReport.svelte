<script lang="ts">
	import ReportHeader from './ReportHeader.svelte';
	import ReportFooter from './ReportFooter.svelte';
	import { ShieldCheck, AlertTriangle, Activity, Users } from '@lucide/svelte';
	import { BarChart, PieChart, LineChart, Arc, Text } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';

	interface AuditLogEntry {
		log_id: string;
		actor_id: string | null;
		details: string;
		severity_level: string;
		ip_address: string | null;
		timestamp: string;
		event_type: string;
		user_profiles?:
			| {
					first_name: string | null;
					last_name: string | null;
					role: string | null;
			  }
			| {
					first_name: string | null;
					last_name: string | null;
					role: string | null;
			  }[]
			| null;
	}

	interface CompanySettings {
		company_name: string;
		contact_info: string;
		registered_address: string;
	}

	interface DataIntegrityReportProps {
		auditLogs: AuditLogEntry[];
		auditTrendData: { month: string; count: number }[];
		companySettings: CompanySettings;
		periodLabel: string;
		generatedAt: string;
	}

	let {
		auditLogs,
		auditTrendData,
		companySettings,
		periodLabel,
		generatedAt
	}: DataIntegrityReportProps = $props();

	const CHART_COLORS = [
		'hsl(217, 91%, 60%)',
		'hsl(142, 71%, 45%)',
		'hsl(47, 96%, 53%)',
		'hsl(262, 83%, 58%)',
		'hsl(12, 76%, 61%)',
		'hsl(195, 74%, 50%)',
		'hsl(330, 70%, 55%)',
		'hsl(170, 65%, 45%)'
	];

	const SEVERITY_COLORS: Record<string, string> = {
		danger: 'hsl(0, 72%, 51%)',
		warning: 'hsl(38, 92%, 50%)',
		notice: 'hsl(142, 71%, 45%)',
		neutral: 'hsl(217, 91%, 60%)'
	};

	const SEVERITY_LABELS: Record<string, string> = {
		danger: 'Danger',
		warning: 'Warning',
		notice: 'Notice',
		neutral: 'Neutral'
	};

	// === Executive Summary Stats ===
	const totalEvents = $derived(auditLogs.length);
	const dangerEvents = $derived(auditLogs.filter((l) => l.severity_level === 'danger').length);
	const warningEvents = $derived(auditLogs.filter((l) => l.severity_level === 'warning').length);
	const uniqueUsers = $derived(
		new Set(auditLogs.filter((l) => l.actor_id).map((l) => l.actor_id)).size
	);

	// === Severity Breakdown (Pie Chart) ===
	const severityBreakdown = $derived(() => {
		const counts: Record<string, number> = {};
		for (const log of auditLogs) {
			const sev = log.severity_level || 'neutral';
			counts[sev] = (counts[sev] ?? 0) + 1;
		}
		return Object.entries(counts)
			.map(([severity, count]) => ({
				type: SEVERITY_LABELS[severity] ?? severity,
				count,
				color: SEVERITY_COLORS[severity] ?? CHART_COLORS[0]
			}))
			.sort((a, b) => b.count - a.count);
	});

	const severityPieConfig = $derived(() => {
		const cfg: Record<string, { label: string; color: string }> = {};
		for (const item of severityBreakdown()) {
			cfg[item.type] = { label: item.type, color: item.color };
		}
		return { count: { label: 'Events' }, ...cfg } satisfies Chart.ChartConfig;
	});

	// === Event Type Breakdown (Bar Chart) ===
	const eventTypeBreakdown = $derived(() => {
		const counts: Record<string, number> = {};
		for (const log of auditLogs) {
			const evt = log.event_type || 'Unknown';
			counts[evt] = (counts[evt] ?? 0) + 1;
		}
		return Object.entries(counts)
			.map(([event, count], i) => ({
				label: event,
				count,
				color: CHART_COLORS[i % CHART_COLORS.length]
			}))
			.sort((a, b) => b.count - a.count);
	});

	const eventTypeBarConfig = $derived(() => {
		const cfg: Record<string, { label: string; color: string }> = {};
		for (const item of eventTypeBreakdown()) {
			cfg[item.label] = { label: item.label, color: item.color };
		}
		return { count: { label: 'Events' }, ...cfg } satisfies Chart.ChartConfig;
	});

	// === Top Users by Activity ===
	const topUsersByActivity = $derived(() => {
		const counts: Record<string, { name: string; role: string; count: number }> = {};
		for (const log of auditLogs) {
			if (!log.actor_id) continue;
			const profileData = log.user_profiles;
			const profile = Array.isArray(profileData) ? profileData[0] : profileData;
			const name = profile
				? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User'
				: 'Unknown User';
			const role = profile?.role ?? 'N/A';
			if (!counts[log.actor_id]) {
				counts[log.actor_id] = { name, role, count: 0 };
			}
			counts[log.actor_id].count += 1;
		}
		return Object.values(counts).sort((a, b) => b.count - a.count);
	});

	// === Security-critical events (danger + warning) ===
	const securityEvents = $derived(
		auditLogs
			.filter((l) => l.severity_level === 'danger' || l.severity_level === 'warning')
			.slice(0, 10)
	);

	// === 6-Month Trend Line Chart ===
	const lineChartData = $derived(
		auditTrendData.map((t, i) => ({
			index: i,
			label: t.month,
			count: t.count
		}))
	);

	const lineChartConfig = {
		count: { label: 'Audit Events', color: 'hsl(262, 83%, 58%)' }
	} satisfies Chart.ChartConfig;

	// === Auto-generate highlights ===
	const highlights = $derived(() => {
		const items: { text: string; type: 'positive' | 'neutral' | 'negative' }[] = [];

		if (dangerEvents > 0) {
			items.push({
				text: `${dangerEvents} danger-level event${dangerEvents !== 1 ? 's' : ''} detected in this period — review recommended`,
				type: 'negative'
			});
		} else {
			items.push({
				text: 'No danger-level security events recorded in this period',
				type: 'positive'
			});
		}

		if (warningEvents > 0) {
			items.push({
				text: `${warningEvents} warning-level event${warningEvents !== 1 ? 's' : ''} logged — monitor for patterns`,
				type: 'neutral'
			});
		}

		if (uniqueUsers > 0) {
			items.push({
				text: `${uniqueUsers} unique user${uniqueUsers !== 1 ? 's' : ''} generated audit trail entries`,
				type: 'neutral'
			});
		}

		const topEvent = eventTypeBreakdown()[0];
		if (topEvent && totalEvents > 0) {
			const pct = ((topEvent.count / totalEvents) * 100).toFixed(0);
			items.push({
				text: `"${topEvent.label}" is the most frequent event type at ${pct}% of total`,
				type: 'neutral'
			});
		}

		const topUser = topUsersByActivity()[0];
		if (topUser) {
			items.push({
				text: `${topUser.name} leads in activity with ${topUser.count} logged events`,
				type: 'positive'
			});
		}

		if (items.length === 0) {
			items.push({ text: 'No audit log data available for this period', type: 'neutral' });
		}

		return items;
	});
</script>

<div id="data-integrity-report" class="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
	<!-- Header -->
	<ReportHeader
		companyName={companySettings.company_name}
		subtitle="Data Integrity & Security Report"
		{periodLabel}
		{generatedAt}
	/>

	<!-- Executive Summary -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Executive Summary</h3>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
			<!-- Total Audit Events -->
			<div class="rounded-lg border-l-4 border-l-blue-500 bg-blue-50 p-4 dark:bg-blue-950/30">
				<div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
					<Activity class="size-3.5!" />
					Total Audit Events
				</div>
				<p class="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{totalEvents}</p>
				<p class="mt-1 text-xs text-muted-foreground">In selected period</p>
			</div>

			<!-- Danger Events -->
			<div class="rounded-lg border-l-4 border-l-red-500 bg-red-50 p-4 dark:bg-red-950/30">
				<div class="flex items-center gap-2 text-xs text-red-600 dark:text-red-400">
					<AlertTriangle class="size-3.5!" />
					Danger Events
				</div>
				<p class="mt-1 text-2xl font-bold text-red-700 dark:text-red-300">{dangerEvents}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{totalEvents > 0
						? `${((dangerEvents / totalEvents) * 100).toFixed(1)}% of total`
						: 'No events'}
				</p>
			</div>

			<!-- Warning Events -->
			<div class="rounded-lg border-l-4 border-l-amber-500 bg-amber-50 p-4 dark:bg-amber-950/30">
				<div class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
					<ShieldCheck class="size-3.5!" />
					Warning Events
				</div>
				<p class="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-300">
					{warningEvents}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{totalEvents > 0
						? `${((warningEvents / totalEvents) * 100).toFixed(1)}% of total`
						: 'No events'}
				</p>
			</div>

			<!-- Unique Users -->
			<div class="rounded-lg border-l-4 border-l-violet-500 bg-violet-50 p-4 dark:bg-violet-950/30">
				<div class="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
					<Users class="size-3.5!" />
					Active Users
				</div>
				<p class="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-300">{uniqueUsers}</p>
				<p class="mt-1 text-xs text-muted-foreground">Users with logged activity</p>
			</div>
		</div>
	</div>

	<!-- Severity Distribution & Event Type Breakdown -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Event Analysis</h3>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Severity Pie Chart -->
			<div class="rounded-lg border p-4">
				<p class="mb-2 text-sm font-medium text-muted-foreground">Severity Distribution</p>
				{#if severityBreakdown().length > 0}
					<div class="h-[220px]">
						<Chart.Container
							config={severityPieConfig()}
							class="mx-auto aspect-square! max-h-[220px] overflow-hidden!"
						>
							<PieChart
								data={severityBreakdown()}
								key="type"
								value="count"
								cRange={severityBreakdown().map((d) => d.color)}
								c="color"
								props={{ pie: { motion: 'tween' } }}
							>
								{#snippet tooltip()}
									<Chart.Tooltip hideLabel />
								{/snippet}
								{#snippet arc({ props: arcProps, visibleData, index })}
									{@const typeName = visibleData[index].type}
									<Arc {...arcProps}>
										{#snippet children({ getArcTextProps })}
											<Text
												value={typeName}
												{...getArcTextProps('centroid')}
												font-size="11"
												class="fill-background"
											/>
										{/snippet}
									</Arc>
								{/snippet}
							</PieChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
						No severity data available
					</div>
				{/if}
			</div>

			<!-- Event Type Bar Chart -->
			<div class="rounded-lg border p-4">
				<p class="mb-2 text-sm font-medium text-muted-foreground">Event Types</p>
				{#if eventTypeBreakdown().length > 0}
					<div class="h-[220px]">
						<Chart.Container
							config={eventTypeBarConfig()}
							class="aspect-auto! h-full! overflow-hidden!"
						>
							<BarChart
								data={eventTypeBreakdown().slice(0, 8)}
								orientation="horizontal"
								yScale={scaleBand().padding(0.25)}
								y="label"
								axis="y"
								rule={false}
								series={[{ key: 'count', label: 'Events', color: CHART_COLORS[0] }]}
								padding={{ right: 16 }}
								props={{
									bars: { stroke: 'none', radius: 5, rounded: 'all' },
									highlight: { area: { fill: 'none' } },
									yAxis: {
										tickLabelProps: {
											textAnchor: 'start',
											dx: 6,
											class: 'stroke-none fill-background!'
										},
										tickLength: 0
									}
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip hideLabel />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
						No event type data available
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Detailed Event Type Table -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Event Type Statistics</h3>
		<div class="overflow-x-auto rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Event Type</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Count</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">% of Total</th>
					</tr>
				</thead>
				<tbody>
					{#each eventTypeBreakdown() as row (row.label)}
						<tr class="border-b">
							<td class="px-4 py-2.5 font-medium">{row.label}</td>
							<td class="px-4 py-2.5 text-right tabular-nums">{row.count}</td>
							<td class="px-4 py-2.5 text-right tabular-nums">
								{totalEvents > 0 ? ((row.count / totalEvents) * 100).toFixed(1) : '0.0'}%
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="bg-primary/5 font-semibold">
						<td class="px-4 py-2.5">Total</td>
						<td class="px-4 py-2.5 text-right tabular-nums">{totalEvents}</td>
						<td class="px-4 py-2.5 text-right tabular-nums">100%</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>

	<!-- User Activity Ranking -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">User Activity Ranking</h3>
		<div class="overflow-x-auto rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Rank</th>
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">User</th>
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Role</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Events</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">% of Total</th>
					</tr>
				</thead>
				<tbody>
					{#each topUsersByActivity().slice(0, 10) as user, i (user.name + i)}
						<tr class="border-b">
							<td class="px-4 py-2 text-muted-foreground">{i + 1}</td>
							<td class="px-4 py-2 font-medium">{user.name}</td>
							<td class="px-4 py-2">
								<span
									class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-xs font-medium"
								>
									{user.role}
								</span>
							</td>
							<td class="px-4 py-2 text-right font-semibold tabular-nums">{user.count}</td>
							<td class="px-4 py-2 text-right tabular-nums">
								{totalEvents > 0 ? ((user.count / totalEvents) * 100).toFixed(1) : '0.0'}%
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Security Alerts (Danger + Warning Events) -->
	{#if securityEvents.length > 0}
		<div>
			<h3 class="mb-3 text-base font-semibold text-foreground">Security Alerts</h3>
			<div class="overflow-x-auto rounded-lg border border-red-200 dark:border-red-900/50">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-red-50/50 dark:bg-red-950/20">
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Timestamp</th>
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Severity</th>
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Event</th>
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Details</th>
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">IP Address</th>
						</tr>
					</thead>
					<tbody>
						{#each securityEvents as event (event.log_id)}
							<tr class="border-b">
								<td class="px-4 py-2 text-xs tabular-nums">
									{new Date(event.timestamp).toLocaleString('en-US', {
										month: 'short',
										day: 'numeric',
										hour: 'numeric',
										minute: '2-digit',
										hour12: true
									})}
								</td>
								<td class="px-4 py-2">
									<span
										class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {event.severity_level ===
										'danger'
											? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
											: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}"
									>
										{SEVERITY_LABELS[event.severity_level] ?? event.severity_level}
									</span>
								</td>
								<td class="px-4 py-2 font-medium">{event.event_type}</td>
								<td class="max-w-[250px] truncate px-4 py-2 text-xs text-muted-foreground">
									{event.details}
								</td>
								<td class="px-4 py-2">
									{#if event.ip_address}
										<span
											class="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
										>
											{event.ip_address}
										</span>
									{:else}
										<span class="text-muted-foreground">N/A</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<!-- 6-Month Audit Trail Trend -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">6-Month Audit Trail Trend</h3>
		<div class="rounded-lg border p-4">
			{#if lineChartData.length > 1}
				<div class="h-[250px]">
					<Chart.Container config={lineChartConfig} class="aspect-auto! h-full! overflow-hidden!">
						<LineChart
							points={{ r: 4 }}
							data={lineChartData}
							x="index"
							axis="x"
							series={[
								{
									key: 'count',
									label: 'Audit Events',
									color: lineChartConfig.count.color
								}
							]}
							props={{
								spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
								highlight: {
									points: { motion: 'none', r: 6 }
								},
								xAxis: {
									format: (v: number) => lineChartData[v]?.label ?? ''
								}
							}}
						>
							{#snippet tooltip()}
								<Chart.Tooltip
									labelFormatter={(v: number) => lineChartData[v]?.label ?? ''}
									indicator="line"
								/>
							{/snippet}
						</LineChart>
					</Chart.Container>
				</div>
			{:else}
				<div class="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
					Not enough data for trend chart
				</div>
			{/if}
			<div class="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
				<span
					class="inline-block size-2 rounded-full"
					style="background-color: {lineChartConfig.count.color}"
				></span>
				Audit Events
			</div>
		</div>
	</div>

	<!-- Footer -->
	<ReportFooter
		highlights={highlights()}
		companyName={companySettings.company_name}
		contactInfo={companySettings.contact_info}
		registeredAddress={companySettings.registered_address}
	/>
</div>
