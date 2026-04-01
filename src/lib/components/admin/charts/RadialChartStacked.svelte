<script lang="ts">
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import { PieChart, Text } from 'layerchart';

	interface RadialChartProps {
		title?: string;
		description?: string;
		chartData: Array<{ key: string; label: string; count: number; color: string }>;
		centerLabel?: string;
	}

	let {
		title = 'Applications Filed',
		description = 'This Month',
		chartData = [],
		centerLabel = 'Applications'
	}: RadialChartProps = $props();

	const chartConfig = $derived(
		chartData.reduce(
			(acc, item) => {
				acc[item.key] = { label: item.label, color: item.color };
				return acc;
			},
			{} as Record<string, { label: string; color: string }>
		)
	);

	const total = $derived(chartData.reduce((sum, item) => sum + item.count, 0));

	const pieData = $derived(
		chartData.map((item) => ({
			platform: item.key,
			visitors: item.count,
			color: item.color
		}))
	);
</script>

<Card.Root class="flex flex-col transition-shadow duration-300 hover:shadow-lg">
	<Card.Header class="items-center">
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content class="flex-1">
		{#if total > 0}
			<Chart.Container config={chartConfig} class="mx-auto aspect-square max-h-[250px]">
				<PieChart
					data={pieData}
					key="platform"
					value="visitors"
					c="color"
					innerRadius={76}
					padding={29}
					range={[-90, 90]}
					props={{ pie: { sort: null } }}
					cornerRadius={4}
				>
					{#snippet aboveMarks()}
						<Text
							value={String(total)}
							textAnchor="middle"
							verticalAnchor="middle"
							class="fill-foreground text-2xl! font-bold"
							dy={-24}
						/>
						<Text
							value={centerLabel}
							textAnchor="middle"
							verticalAnchor="middle"
							class="fill-muted-foreground! text-muted-foreground"
							dy={-4}
						/>
					{/snippet}
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</PieChart>
			</Chart.Container>
		{:else}
			<div class="flex aspect-square max-h-[250px] items-center justify-center">
				<p class="text-sm text-muted-foreground">No applications filed this month</p>
			</div>
		{/if}
	</Card.Content>
	<Card.Footer class="flex-col gap-2 text-sm">
		<div class="flex items-center gap-2 leading-none text-muted-foreground">
			{#each chartData as item (item.key)}
				<span class="flex items-center gap-1.5">
					<span class="size-2.5 rounded-full" style="background-color: {item.color}"></span>
					{item.label}: {item.count}
				</span>
			{/each}
		</div>
	</Card.Footer>
</Card.Root>
