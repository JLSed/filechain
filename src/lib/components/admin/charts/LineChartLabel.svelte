<script lang="ts">
	import { LineChart } from 'layerchart';
	import { scaleUtc } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import { PhilippinePeso } from '@lucide/svelte';

	interface RevenueDataPoint {
		date: Date;
		revenue: number;
	}

	interface LineChartLabelProps {
		title?: string;
		description?: string;
		chartData: RevenueDataPoint[];
		totalRevenue?: number;
	}

	let {
		title = 'Revenue This Month',
		description = 'Daily invoiced revenue',
		chartData = [],
		totalRevenue = 0
	}: LineChartLabelProps = $props();

	const chartConfig = {
		revenue: { label: 'Revenue', color: 'var(--chart-2)' }
	} satisfies Chart.ChartConfig;

	const formattedTotal = $derived(
		new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(totalRevenue)
	);
</script>

<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
	<Card.Header>
		<div class="flex items-center justify-between">
			<div>
				<Card.Title>{title}</Card.Title>
				<Card.Description>{description}</Card.Description>
			</div>
			<PhilippinePeso class="size-5! text-muted-foreground" />
		</div>
	</Card.Header>
	<Card.Content>
		{#if chartData.length > 1}
			<Chart.Container config={chartConfig}>
				<LineChart
					points={{ r: 4 }}
					labels={{ offset: 12 }}
					data={chartData}
					x="date"
					axis="x"
					xScale={scaleUtc()}
					series={[
						{
							key: 'revenue',
							label: 'Revenue',
							color: chartConfig.revenue.color
						}
					]}
					props={{
						spline: { curve: curveNatural, motion: 'tween', strokeWidth: 2 },
						highlight: {
							points: {
								motion: 'none',
								r: 6
							}
						},
						xAxis: {
							format: (v: Date) => v.toLocaleDateString('en-US', { day: 'numeric' })
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip
							labelFormatter={(v: Date) => {
								return v.toLocaleDateString('en-US', {
									month: 'long',
									day: 'numeric'
								});
							}}
							indicator="line"
						/>
					{/snippet}
				</LineChart>
			</Chart.Container>
		{:else if chartData.length === 1}
			<div class="flex h-[200px] flex-col items-center justify-center gap-2">
				<p class="text-lg font-semibold text-foreground">{formattedTotal}</p>
				<p class="text-sm text-muted-foreground">Single entry this month</p>
			</div>
		{:else}
			<div class="flex h-[200px] items-center justify-center">
				<p class="text-sm text-muted-foreground">No revenue data this month</p>
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="grid gap-2">
				<div class="flex items-center gap-2 leading-none font-medium">
					Total: {formattedTotal}
				</div>
				<div class="flex items-center gap-2 leading-none text-muted-foreground">
					Revenue from invoiced services
				</div>
			</div>
		</div>
	</Card.Footer>
</Card.Root>
