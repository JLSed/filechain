<script lang="ts">
	import { TrendingUp, TrendingDown, ExternalLink } from '@lucide/svelte';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import type { Component } from 'svelte';

	interface ApplicationItem {
		application_id: string;
		application_number?: string | null;
	}

	interface SectionCardProps {
		title: string;
		value: string | number;
		description?: string;
		trend?: { value: string; direction: 'up' | 'down' };
		icon?: Component;
		variant?: 'default' | 'destructive';
		applications?: ApplicationItem[];
	}

	let {
		title,
		value,
		description = '',
		trend,
		icon: IconComponent,
		variant = 'default',
		applications = []
	}: SectionCardProps = $props();

	const isDestructive = $derived(variant === 'destructive');
</script>

<Card.Root
	class="@container/card relative flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg {isDestructive
		? 'border-destructive/30 bg-destructive/5'
		: ''}"
>
	<Card.Header>
		<div class="flex items-center justify-between">
			<Card.Description class={isDestructive ? 'font-medium text-destructive/80' : ''}>
				{title}
			</Card.Description>
			{#if IconComponent}
				<IconComponent
					class="size-5 {isDestructive ? 'text-destructive' : 'text-muted-foreground'}"
				/>
			{/if}
		</div>
		<Card.Title
			class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl {isDestructive
				? 'text-destructive'
				: ''}"
		>
			{value}
		</Card.Title>
		{#if trend}
			<Card.Action>
				<Badge
					variant="outline"
					class={isDestructive
						? 'border-destructive/40 text-destructive'
						: trend.direction === 'up'
							? 'border-chart-2/40 text-chart-2'
							: 'border-destructive/40 text-destructive'}
				>
					{#if trend.direction === 'up'}
						<TrendingUp class="size-3.5!" />
					{:else}
						<TrendingDown class="size-3.5!" />
					{/if}
					{trend.value}
				</Badge>
			</Card.Action>
		{/if}
	</Card.Header>

	{#if description}
		<div class="px-6 pb-2">
			<span class="text-sm text-muted-foreground">{description}</span>
		</div>
	{/if}

	{#if applications.length > 0}
		<div class="flex-1 overflow-hidden px-6 pb-4">
			<div class="no-scrollbar flex max-h-[180px] flex-col gap-1.5 overflow-y-auto">
				{#each applications as app (app.application_id)}
					<a
						href="/application/{app.application_id}"
						class="group flex items-center justify-between rounded-md border px-3 py-2 text-sm font-medium tabular-nums transition-all duration-150 hover:shadow-sm
						{isDestructive
							? 'border-destructive/20 bg-destructive/5 text-destructive hover:border-destructive/40 hover:bg-destructive/10'
							: 'border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted'}"
					>
						<span>{app.application_number ?? app.application_id.slice(0, 8)}</span>
						<ExternalLink
							class="size-3.5! opacity-40 transition-opacity group-hover:opacity-100
							{isDestructive ? 'text-destructive' : 'text-muted-foreground'}"
						/>
					</a>
				{/each}
			</div>
		</div>
	{/if}
</Card.Root>
