<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { RefreshCw, FileText, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import SectionCard from '$lib/components/admin/charts/SectionCard.svelte';
	import RadialChartStacked from '$lib/components/admin/charts/RadialChartStacked.svelte';
	import BarChartCustomLabel from '$lib/components/admin/charts/BarChartCustomLabel.svelte';
	import LineChartLabel from '$lib/components/admin/charts/LineChartLabel.svelte';
	import BarChartActive from '$lib/components/admin/charts/BarChartActive.svelte';

	let { data } = $props();
	let isRefreshing = $state(false);

	const CHART_COLORS = [
		'var(--chart-1)',
		'var(--chart-2)',
		'var(--chart-3)',
		'var(--chart-4)',
		'var(--chart-5)'
	];

	// Helper to extract invention name safely across single objects or PostgREST array unwrapping
	function getInventionName(typeData: unknown): string {
		if (!typeData) return 'Unknown';
		if (Array.isArray(typeData)) return typeData[0]?.name || 'Unknown';
		return (typeData as { name?: string }).name || 'Unknown';
	}

	// --- Active Applications count ---
	const activeCount = $derived(data.activeApplications.length);

	// --- Applications Filed This Month (by invention type) ---
	const monthlyByType = $derived(() => {
		const counts: Record<string, number> = {};
		for (const app of data.monthlyApplications) {
			const name = getInventionName(app.type_of_invention);
			counts[name] = (counts[name] ?? 0) + 1;
		}
		return Object.entries(counts).map(([name, count], idx) => ({
			key: name.toLowerCase().replace(/\s+/g, '_'),
			label: name,
			count,
			color: CHART_COLORS[idx % CHART_COLORS.length]
		}));
	});

	// --- Deadlines This Week ---
	const weeklyDeadlines = $derived(() => {
		const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
		const countByDay: Record<string, number> = {};

		for (const app of data.weeklyDeadlines) {
			if (!app.deadline) continue;
			const d = new Date(app.deadline + 'T00:00:00');
			const dayIdx = d.getDay(); // 0=Sun
			const label = dayNames[dayIdx === 0 ? 6 : dayIdx - 1]; // shift to Mon-based
			countByDay[label] = (countByDay[label] ?? 0) + 1;
		}

		return dayNames
			.map((day) => ({
				label: day,
				count: countByDay[day] ?? 0
			}))
			.filter((d) => d.count > 0);
	});

	// --- Overdue Cases ---
	const overdueCount = $derived(data.overdueApplications.length);

	// --- Revenue This Month ---
	const revenueChart = $derived(() => {
		const dailyTotals: Record<string, number> = {};
		for (const app of data.revenueData) {
			const dateStr = new Date(app.created_at).toISOString().split('T')[0];
			dailyTotals[dateStr] = (dailyTotals[dateStr] ?? 0) + Number(app.fees);
		}

		return Object.entries(dailyTotals)
			.sort(([a], [b]) => a.localeCompare(b))
			.map(([dateStr, revenue]) => ({
				date: new Date(dateStr),
				revenue
			}));
	});

	const totalRevenue = $derived(
		data.revenueData.reduce((sum, app) => sum + Number(app.fees ?? 0), 0)
	);

	// --- Application Breakdown by Type ---
	const breakdownData = $derived(() => {
		const counts: Record<string, { name: string; count: number }> = {};
		for (const app of data.activeApplications) {
			const name = getInventionName(app.type_of_invention);
			const key = name.toLowerCase().replace(/\s+/g, '_');
			if (!counts[key]) {
				counts[key] = { name, count: 0 };
			}
			counts[key].count += 1;
		}
		return Object.entries(counts).map(([key, { count }], idx) => ({
			type: key,
			count,
			color: CHART_COLORS[idx % CHART_COLORS.length]
		}));
	});

	const breakdownConfig = $derived(() => {
		const config: Record<string, { label: string; color: string }> = {};
		const seen: Record<string, boolean> = {};
		let colorIdx = 0;

		for (const app of data.activeApplications) {
			const name = getInventionName(app.type_of_invention);
			const key = name.toLowerCase().replace(/\s+/g, '_');
			if (!seen[key]) {
				seen[key] = true;
				config[key] = {
					label: name,
					color: CHART_COLORS[colorIdx % CHART_COLORS.length]
				};
				colorIdx++;
			}
		}
		return config;
	});

	async function handleRefresh() {
		isRefreshing = true;
		await invalidate('db:dashboard');
		// Small delay for visual feedback
		setTimeout(() => {
			isRefreshing = false;
		}, 600);
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
			<p class="text-sm text-muted-foreground">Overview of your IP application management system</p>
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

	<!-- Top Row: Stat Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<SectionCard
			title="Total Active Applications"
			value={activeCount}
			description="Applications currently in progress"
			icon={FileText}
			applications={data.activeApplications}
		/>

		<div class="sm:col-span-1 xl:col-span-2">
			<LineChartLabel
				title="Revenue This Month"
				description={data.currentMonth}
				chartData={revenueChart()}
				{totalRevenue}
			/>
		</div>

		<SectionCard
			title="Overdue Cases"
			value={overdueCount}
			description={overdueCount > 0
				? `${overdueCount} case${overdueCount > 1 ? 's' : ''} past deadline`
				: 'No overdue cases'}
			icon={AlertTriangle}
			variant="destructive"
			applications={data.overdueApplications}
		/>
	</div>

	<!-- Bottom Row: Charts -->
	<div class="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
		<BarChartCustomLabel
			title="Deadlines This Week"
			description={data.weekRange}
			chartData={weeklyDeadlines()}
		/>

		<RadialChartStacked
			title="Applications Filed This Month"
			description={data.currentMonth}
			chartData={monthlyByType()}
			centerLabel="Filed"
		/>

		<BarChartActive
			title="Application Breakdown"
			description="By Type of Invention"
			chartData={breakdownData()}
			chartConfig={breakdownConfig()}
		/>
	</div>
</div>
