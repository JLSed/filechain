<script lang="ts">
	import ReportHeader from './ReportHeader.svelte';
	import ReportFooter from './ReportFooter.svelte';
	import { TrendingUp, TrendingDown, FileText, PhilippinePeso, BarChart3 } from '@lucide/svelte';
	import { LineChart, BarChart, PieChart, Arc, Text } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';

	interface Application {
		application_id: string;
		application_number?: string | null;
		type_of_invention_id: number;
		type_of_invention?: { name: string } | { name: string }[] | null;
		status?: string;
		filling_date?: string | null;
		fees?: number | string | null;
		client_id?: string | null;
	}

	interface Payment {
		payment_id: string;
		amount: number | string;
		ewt_amount?: number | string;
		payment_date: string;
		invoice_id?: string;
	}

	interface CompanySettings {
		company_name: string;
		contact_info: string;
		registered_address: string;
	}

	interface MonthlyFilingReportProps {
		currentApplications: Application[];
		prevApplications: Application[];
		currentPayments: Payment[];
		prevPayments: { amount: number | string }[];
		trendData: { month: string; count: number }[];
		companySettings: CompanySettings;
		periodLabel: string;
		generatedAt: string;
	}

	let {
		currentApplications,
		prevApplications,
		currentPayments,
		prevPayments,
		trendData,
		companySettings,
		periodLabel,
		generatedAt
	}: MonthlyFilingReportProps = $props();

	const CHART_COLORS = [
		'hsl(217, 91%, 60%)',
		'hsl(142, 71%, 45%)',
		'hsl(47, 96%, 53%)',
		'hsl(262, 83%, 58%)',
		'hsl(12, 76%, 61%)'
	];

	function getTypeName(app: Application): string {
		if (!app.type_of_invention) return 'Unknown';
		if (Array.isArray(app.type_of_invention)) return app.type_of_invention[0]?.name || 'Unknown';
		return app.type_of_invention.name || 'Unknown';
	}

	function formatCurrency(val: number): string {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
	}

	function formatCompact(val: number): string {
		if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
		if (val >= 1000) return `₱${(val / 1000).toFixed(0)}K`;
		return formatCurrency(val);
	}

	function pctChange(current: number, prev: number): { value: string; direction: 'up' | 'down' } {
		if (prev === 0) return { value: current > 0 ? '+100%' : '0%', direction: 'up' };
		const pct = ((current - prev) / prev) * 100;
		return {
			value: `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`,
			direction: pct >= 0 ? 'up' : 'down'
		};
	}

	// === Computed stats ===
	const totalFilings = $derived(currentApplications.length);
	const prevFilings = $derived(prevApplications.length);

	const totalRevenue = $derived(currentPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0));
	const prevRevenue = $derived(prevPayments.reduce((sum, p) => sum + Number(p.amount ?? 0), 0));

	const avgRevenuePerFiling = $derived(totalFilings > 0 ? totalRevenue / totalFilings : 0);

	const filingsTrend = $derived(pctChange(totalFilings, prevFilings));
	const revenueTrend = $derived(pctChange(totalRevenue, prevRevenue));

	// === Filing breakdown by type ===
	const typeBreakdown = $derived(() => {
		const map: Record<string, { name: string; count: number; revenue: number }> = {};
		for (const app of currentApplications) {
			const name = getTypeName(app);
			if (!map[name]) map[name] = { name, count: 0, revenue: 0 };
			map[name].count += 1;
		}
		// Revenue by type: approximate by distributing equally (since payments aren't directly linked to types)
		const entries = Object.values(map);
		if (totalFilings > 0) {
			for (const e of entries) {
				e.revenue = (e.count / totalFilings) * totalRevenue;
			}
		}
		return entries.map((e, i) => ({ ...e, color: CHART_COLORS[i % CHART_COLORS.length] }));
	});

	// Chart data for bar chart
	const barChartData = $derived(
		typeBreakdown().map((t) => ({
			type: t.name,
			count: t.count,
			color: t.color
		}))
	);

	const barChartConfig = $derived(() => {
		const cfg: Record<string, { label: string; color: string }> = {};
		for (const t of typeBreakdown()) {
			cfg[t.name] = { label: t.name, color: t.color };
		}
		return { count: { label: 'Filings' }, ...cfg } satisfies Chart.ChartConfig;
	});

	// Chart data for pie chart
	const pieChartData = $derived(
		typeBreakdown().map((t) => ({
			type: t.name,
			value: t.revenue,
			color: t.color
		}))
	);

	const pieChartConfig = $derived(() => {
		const cfg: Record<string, { label: string; color: string }> = {};
		for (const t of typeBreakdown()) {
			cfg[t.name] = { label: t.name, color: t.color };
		}
		return { value: { label: 'Revenue' }, ...cfg } satisfies Chart.ChartConfig;
	});

	// Line chart data for 6-month trend
	const lineChartData = $derived(
		trendData.map((t, i) => ({
			index: i,
			label: t.month,
			count: t.count
		}))
	);

	const lineChartConfig = {
		count: { label: 'Total Filings', color: 'hsl(217, 91%, 60%)' }
	} satisfies Chart.ChartConfig;

	// Auto-generate key highlights
	const highlights = $derived(() => {
		const items: { text: string; type: 'positive' | 'neutral' | 'negative' }[] = [];

		if (filingsTrend.direction === 'up' && totalFilings > prevFilings) {
			items.push({
				text: `Filings increased by ${filingsTrend.value} compared to previous month`,
				type: 'positive'
			});
		} else if (totalFilings < prevFilings) {
			items.push({
				text: `Filings decreased by ${filingsTrend.value} compared to previous month`,
				type: 'negative'
			});
		}

		const topType = typeBreakdown().sort((a, b) => b.count - a.count)[0];
		if (topType) {
			items.push({
				text: `${topType.name} applications lead with ${topType.count} filings this period`,
				type: 'neutral'
			});
		}

		if (revenueTrend.direction === 'up' && totalRevenue > prevRevenue) {
			items.push({
				text: `Overall revenue grew by ${revenueTrend.value}`,
				type: 'positive'
			});
		} else if (totalRevenue < prevRevenue) {
			items.push({
				text: `Revenue declined by ${revenueTrend.value} vs previous month`,
				type: 'negative'
			});
		}

		if (items.length === 0) {
			items.push({ text: 'No significant changes detected this period', type: 'neutral' });
		}

		return items;
	});
</script>

<div id="monthly-filing-report" class="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
	<!-- Header -->
	<ReportHeader
		companyName={companySettings.company_name}
		subtitle="Monthly Filing Report"
		{periodLabel}
		{generatedAt}
	/>

	<!-- Executive Summary -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Executive Summary</h3>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<!-- Total Filings -->
			<div class="rounded-lg border-l-4 border-l-blue-500 bg-blue-50 p-4 dark:bg-blue-950/30">
				<div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
					<FileText class="size-3.5!" />
					Total Filings
				</div>
				<p class="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{totalFilings}</p>
				<div
					class="mt-1 flex items-center gap-1 text-xs {filingsTrend.direction === 'up'
						? 'text-emerald-600'
						: 'text-red-500'}"
				>
					{#if filingsTrend.direction === 'up'}
						<TrendingUp class="size-3!" />
					{:else}
						<TrendingDown class="size-3!" />
					{/if}
					{filingsTrend.value} vs previous month
				</div>
			</div>

			<!-- Total Revenue -->
			<div
				class="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/30"
			>
				<div class="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
					<PhilippinePeso class="size-3.5!" />
					Total Revenue
				</div>
				<p class="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
					{formatCompact(totalRevenue)}
				</p>
				<div
					class="mt-1 flex items-center gap-1 text-xs {revenueTrend.direction === 'up'
						? 'text-emerald-600'
						: 'text-red-500'}"
				>
					{#if revenueTrend.direction === 'up'}
						<TrendingUp class="size-3!" />
					{:else}
						<TrendingDown class="size-3!" />
					{/if}
					{revenueTrend.value} vs previous month
				</div>
			</div>

			<!-- Avg Revenue/Filing -->
			<div class="rounded-lg border-l-4 border-l-violet-500 bg-violet-50 p-4 dark:bg-violet-950/30">
				<div class="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
					<BarChart3 class="size-3.5!" />
					Avg Revenue/Filing
				</div>
				<p class="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-300">
					{formatCurrency(avgRevenuePerFiling)}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">Per application</p>
			</div>
		</div>
	</div>

	<!-- Filing Breakdown by IP Type -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Filing Breakdown by IP Type</h3>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Bar Chart: Number of Filings -->
			<div class="rounded-lg border p-4">
				<p class="mb-2 text-sm font-medium text-muted-foreground">Number of Filings</p>
				{#if barChartData.length > 0}
					<div class="h-[200px]">
						<Chart.Container
							config={barChartConfig()}
							class="aspect-auto! h-full! overflow-hidden!"
						>
							<BarChart
								data={barChartData}
								x="type"
								y="count"
								c="color"
								cRange={barChartData.map((d) => d.color)}
								xScale={scaleBand().padding(0.3)}
								axis="x"
								rule={false}
								props={{
									bars: { stroke: 'none', radius: 6, rounded: 'all' },
									highlight: { area: { fill: 'none' } }
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip hideLabel nameKey="count" />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
						No filing data available
					</div>
				{/if}
			</div>

			<!-- Pie Chart: Revenue Distribution -->
			<div class="rounded-lg border p-4">
				<p class="mb-2 text-sm font-medium text-muted-foreground">Revenue Distribution</p>
				{#if pieChartData.length > 0}
					<div class="h-[200px]">
						<Chart.Container
							config={pieChartConfig()}
							class="mx-auto aspect-square! max-h-[200px] overflow-hidden!"
						>
							<PieChart
								data={pieChartData}
								key="type"
								value="value"
								cRange={pieChartData.map((d) => d.color)}
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
												font-size="10"
												class="fill-background capitalize"
											/>
										{/snippet}
									</Arc>
								{/snippet}
							</PieChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
						No revenue data available
					</div>
				{/if}
			</div>
		</div>
	</div>

	<!-- Detailed Statistics Table -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Detailed Statistics</h3>
		<div class="overflow-x-auto rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">IP Type</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Filings</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Revenue</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Avg/Filing</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">% of Total</th>
					</tr>
				</thead>
				<tbody>
					{#each typeBreakdown() as row (row.name)}
						<tr class="border-b">
							<td class="px-4 py-2.5 font-medium">{row.name}</td>
							<td class="px-4 py-2.5 text-right tabular-nums">{row.count}</td>
							<td class="px-4 py-2.5 text-right tabular-nums">{formatCurrency(row.revenue)}</td>
							<td class="px-4 py-2.5 text-right tabular-nums">
								{formatCurrency(row.count > 0 ? row.revenue / row.count : 0)}
							</td>
							<td class="px-4 py-2.5 text-right tabular-nums">
								{totalFilings > 0 ? ((row.count / totalFilings) * 100).toFixed(1) : '0.0'}%
							</td>
						</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr class="bg-primary/5 font-semibold">
						<td class="px-4 py-2.5">Total</td>
						<td class="px-4 py-2.5 text-right tabular-nums">{totalFilings}</td>
						<td class="px-4 py-2.5 text-right tabular-nums">{formatCurrency(totalRevenue)}</td>
						<td class="px-4 py-2.5 text-right tabular-nums"
							>{formatCurrency(avgRevenuePerFiling)}</td
						>
						<td class="px-4 py-2.5 text-right tabular-nums">100%</td>
					</tr>
				</tfoot>
			</table>
		</div>
	</div>

	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">6-Month Filing Trend</h3>
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
									label: 'Total Filings',
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
				Total Filings
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
