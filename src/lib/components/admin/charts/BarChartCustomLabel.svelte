<script lang="ts">
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import { BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';
	import { CalendarClock } from '@lucide/svelte';

	interface DeadlineItem {
		label: string;
		count: number;
	}

	interface BarChartCustomLabelProps {
		title?: string;
		description?: string;
		chartData: DeadlineItem[];
	}

	let {
		title = 'Deadlines This Week',
		description = 'Weekly Overview',
		chartData = []
	}: BarChartCustomLabelProps = $props();

	const chartConfig = {
		count: { label: 'Deadlines', color: 'var(--chart-1)' },
		label: { color: 'var(--background)' }
	} satisfies Chart.ChartConfig;
</script>

<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
	<Card.Header>
		<div class="flex items-center justify-between">
			<div>
				<Card.Title>{title}</Card.Title>
				<Card.Description>{description}</Card.Description>
			</div>
			<CalendarClock class="size-5! text-muted-foreground" />
		</div>
	</Card.Header>
	<Card.Content>
		{#if chartData.length > 0}
			<Chart.Container config={chartConfig}>
				<BarChart
					labels={{ offset: 12 }}
					data={chartData}
					orientation="horizontal"
					yScale={scaleBand().padding(0.25)}
					y="label"
					axis="y"
					rule={false}
					series={[{ key: 'count', label: 'Deadlines', color: chartConfig.count.color }]}
					padding={{ right: 16 }}
					props={{
						bars: {
							stroke: 'none',
							radius: 5,
							rounded: 'all',
							initialWidth: 0,
							initialX: 0,
							motion: {
								x: { type: 'tween', duration: 500, easing: cubicInOut },
								width: { type: 'tween', duration: 500, easing: cubicInOut }
							}
						},
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
		{:else}
			<div class="flex h-[200px] items-center justify-center">
				<p class="text-sm text-muted-foreground">No deadlines this week</p>
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="leading-none text-muted-foreground">Showing deadlines for the current week</div>
		</div>
	</Card.Footer>
</Card.Root>
