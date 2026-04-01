<script lang="ts">
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';
	import { scaleBand } from 'd3-scale';
	import { Bar, BarChart, type ChartContextValue } from 'layerchart';
	import { cubicInOut } from 'svelte/easing';

	interface BarChartItem {
		type: string;
		count: number;
		color: string;
	}

	interface BarChartActiveProps {
		title?: string;
		description?: string;
		chartData: BarChartItem[];
		chartConfig: Record<string, { label: string; color: string }>;
		activeIndex?: number;
	}

	let {
		title = 'Application Breakdown',
		description = 'By Type of Invention',
		chartData = [],
		chartConfig = {},
		activeIndex = -1
	}: BarChartActiveProps = $props();

	let context = $state<ChartContextValue>();

	// Find the index of the highest count for the "active" bar
	const highlightIdx = $derived(() => {
		if (activeIndex >= 0) return activeIndex;
		if (chartData.length === 0) return -1;
		return chartData.reduce(
			(maxIdx, item, idx, arr) => (item.count > arr[maxIdx].count ? idx : maxIdx),
			0
		);
	});

	const fullConfig = $derived({
		count: { label: 'Applications' },
		...chartConfig
	} satisfies Chart.ChartConfig);
</script>

<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if chartData.length > 0}
			<Chart.Container config={fullConfig}>
				<BarChart
					bind:context
					data={chartData}
					x="type"
					c="color"
					y="count"
					cRange={chartData.map((c) => c.color)}
					xScale={scaleBand().padding(0.25)}
					axis="x"
					rule={false}
					props={{
						bars: {
							stroke: 'none',
							radius: 8,
							rounded: 'all',
							initialY: context?.height,
							initialHeight: 0,
							motion: {
								y: { type: 'tween', duration: 500, easing: cubicInOut },
								height: { type: 'tween', duration: 500, easing: cubicInOut }
							}
						},
						xAxis: {
							format: (d: string) => {
								const configEntry = chartConfig[d as keyof typeof chartConfig];
								return configEntry ? configEntry.label : d;
							}
						},
						highlight: { area: { fill: 'none' } }
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel nameKey="count" />
					{/snippet}
					{#snippet marks({ getBarsProps, visibleSeries })}
						{@const baseBarProps = getBarsProps(visibleSeries[0], 0)}
						{#each chartData as data, i (i)}
							{#if i === highlightIdx()}
								<!-- The "active" bar -->
								<Bar
									{...baseBarProps}
									motion="tween"
									fill={data.color}
									{data}
									fillOpacity={0.8}
									stroke={data.color}
									strokeWidth={2}
									stroke-dasharray={4}
									stroke-dashoffset={4}
								/>
							{:else}
								<Bar {...baseBarProps} fill={data.color} {data} motion="tween" />
							{/if}
						{/each}
					{/snippet}
				</BarChart>
			</Chart.Container>
		{:else}
			<div class="flex h-[200px] items-center justify-center">
				<p class="text-sm text-muted-foreground">No application data available</p>
			</div>
		{/if}
	</Card.Content>
	<Card.Footer>
		<div class="flex w-full items-start gap-2 text-sm">
			<div class="flex flex-wrap gap-3">
				{#each chartData as item (item.type)}
					<span class="flex items-center gap-1.5">
						<span class="size-2.5 rounded-full" style="background-color: {item.color}"></span>
						<span class="text-muted-foreground"
							>{chartConfig[item.type]?.label ?? item.type}: {item.count}</span
						>
					</span>
				{/each}
			</div>
		</div>
	</Card.Footer>
</Card.Root>
