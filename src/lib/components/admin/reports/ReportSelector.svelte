<script lang="ts">
	import { FileText, Users, ShieldCheck } from '@lucide/svelte';
	import type { Component } from 'svelte';

	type ReportType = 'monthly' | 'client' | 'integrity';

	interface ReportSelectorProps {
		selected: ReportType;
		onselect: (type: ReportType) => void;
	}

	let { selected, onselect }: ReportSelectorProps = $props();

	const reports: { type: ReportType; title: string; description: string; icon: Component }[] = [
		{
			type: 'monthly',
			title: 'Monthly Filing Report',
			description: 'Applications & revenue overview by IP type',
			icon: FileText
		},
		{
			type: 'client',
			title: 'Client Statistics',
			description: 'Client demographics & filing rankings',
			icon: Users
		},
		{
			type: 'integrity',
			title: 'Data Integrity & Security',
			description: 'System security & data integrity metrics',
			icon: ShieldCheck
		}
	];
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
	{#each reports as report (report.type)}
		{@const isActive = selected === report.type}
		<button
			type="button"
			class="flex items-start gap-3 rounded-lg border p-4 text-left transition-all duration-200
				{isActive
				? 'border-primary bg-primary/5 shadow-sm ring-2 ring-primary/20'
				: 'border-border bg-background hover:border-primary/30 hover:bg-muted/50'}"
			onclick={() => onselect(report.type)}
		>
			<div
				class="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-md
					{isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}"
			>
				<report.icon class="size-4!" />
			</div>
			<div class="min-w-0">
				<p class="text-sm font-medium {isActive ? 'text-primary' : 'text-foreground'}">
					{report.title}
				</p>
				<p class="mt-0.5 text-xs text-muted-foreground">{report.description}</p>
			</div>
		</button>
	{/each}
</div>
