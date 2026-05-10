<script lang="ts">
	import { untrack } from 'svelte';
	import { CalendarDays, Play } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';

	interface ReportControlsProps {
		selectedMonth: number;
		selectedYear: number;
		dateFrom: string;
		dateTo: string;
		onGenerate: (params: { month: number; year: number; dateFrom: string; dateTo: string }) => void;
		isGenerating?: boolean;
		disabled?: boolean;
	}

	const props: ReportControlsProps = $props();

	let month = $state(untrack(() => props.selectedMonth));
	let year = $state(untrack(() => props.selectedYear));
	let fromDate = $state(untrack(() => props.dateFrom));
	let toDate = $state(untrack(() => props.dateTo));
	let useRange = $state(untrack(() => Boolean(props.dateFrom && props.dateTo)));

	const onGenerate = $derived(props.onGenerate);
	const isGenerating = $derived(props.isGenerating ?? false);
	const isDisabled = $derived(props.disabled ?? false);

	const months = [
		'January',
		'February',
		'March',
		'April',
		'May',
		'June',
		'July',
		'August',
		'September',
		'October',
		'November',
		'December'
	];

	const currentYear = new Date().getFullYear();
	const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

	function handleGenerate() {
		if (useRange && fromDate && toDate) {
			onGenerate({ month, year, dateFrom: fromDate, dateTo: toDate });
		} else {
			onGenerate({ month, year, dateFrom: '', dateTo: '' });
		}
	}
</script>

<div class="flex flex-col gap-3 rounded-lg border border-border bg-muted/30 p-4">
	<div class="flex items-center gap-2 text-sm font-medium text-muted-foreground">
		<CalendarDays class="size-4!" />
		Report Period
	</div>

	<div class="flex flex-col gap-3 sm:flex-row sm:items-end">
		<!-- Mode toggle -->
		<div class="flex gap-2">
			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors
					{!useRange
					? 'bg-primary text-primary-foreground'
					: 'bg-background text-muted-foreground hover:bg-muted'}"
				onclick={() => (useRange = false)}
			>
				Month
			</button>
			<button
				type="button"
				class="rounded-md px-3 py-1.5 text-xs font-medium transition-colors
					{useRange
					? 'bg-primary text-primary-foreground'
					: 'bg-background text-muted-foreground hover:bg-muted'}"
				onclick={() => (useRange = true)}
			>
				Date Range
			</button>
		</div>

		{#if useRange}
			<div class="flex items-center gap-2">
				<Input type="date" class="w-auto" bind:value={fromDate} />
				<span class="text-xs text-muted-foreground">to</span>
				<Input type="date" class="w-auto" bind:value={toDate} />
			</div>
		{:else}
			<div class="flex gap-2">
				<select
					class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					bind:value={month}
				>
					{#each months as m, i (m)}
						<option value={i}>{m}</option>
					{/each}
				</select>
				<select
					class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					bind:value={year}
				>
					{#each years as y (y)}
						<option value={y}>{y}</option>
					{/each}
				</select>
			</div>
		{/if}

		<Button size="sm" class="gap-2" onclick={handleGenerate} disabled={isGenerating || isDisabled}>
			<Play class="size-3.5!" />
			Generate Report
		</Button>
	</div>
</div>
