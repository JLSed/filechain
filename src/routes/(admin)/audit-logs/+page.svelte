<script lang="ts">
	import { AuditLogTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import AuditLogDetailsSheet from '$lib/components/admin/audit-logs/AuditLogDetailsSheet.svelte';
	import { AlertCircle, ArrowRight, RefreshCcw, Search } from '@lucide/svelte';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	const table = new AuditLogTableState(untrack(() => data.logs));

	$effect(() => {
		table.rows = data.logs;
	});

	/**
	 * Maps severity levels to badge styling consistent with the project's design system.
	 */
	function getSeverityBadge(severity: string): {
		variant: 'default' | 'secondary' | 'outline' | 'destructive';
		class: string;
		label: string;
	} {
		switch (severity) {
			case 'danger':
				return { variant: 'destructive', class: '', label: 'Danger' };
			case 'warning':
				return {
					variant: 'default',
					class: 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400',
					label: 'Warning'
				};
			case 'notice':
				return {
					variant: 'default',
					class: 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400',
					label: 'Notice'
				};
			default:
				return { variant: 'secondary', class: '', label: 'Neutral' };
		}
	}
</script>

<main class="p-2">
	<h1>Audit Logs</h1>
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="icon"
			disabled={table.isRefreshing}
			onclick={() => table.handleRefresh('db:audit-logs')}
		>
			<RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" />
		</Button>
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={table.searchValue}
				type="search"
				placeholder="Search audit logs"
				class="max-w-lg pl-9"
				oninput={() => {
					table.currentPage = 1;
				}}
			/>
		</div>
	</div>
	<div class="my-4">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="min-w-[140px]">Date & Time</Table.Head>
					<Table.Head class="w-[100px]">Status</Table.Head>
					<Table.Head class="w-[110px]">IP</Table.Head>
					<Table.Head>Subject</Table.Head>
					<Table.Head class="w-[130px] text-right">Action</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.error}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12">
							<div class="flex flex-col items-center justify-center space-y-3 text-center">
								<AlertCircle class="size-8 text-primary/70" />
								<p class="text-sm font-medium text-primary/60">{data.error}</p>
								<Button
									variant="outline"
									size="sm"
									onclick={() => table.handleRefresh('db:audit-logs')}
								>
									Try Again
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else if table.isRefreshing}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
							Getting the latest audit logs...
						</Table.Cell>
					</Table.Row>
				{:else if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
							No audit logs found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.paginatedRows as row (row.log_id)}
						{@const badge = getSeverityBadge(row.severity_level)}
						<Table.Row
							class="cursor-pointer transition-colors hover:bg-muted/50"
							onclick={() => table.openDetails(row)}
						>
							<Table.Cell>
								<div class="flex flex-col">
									<span class="text-sm font-medium">
										{new Date(row.timestamp).toLocaleTimeString('en-US', {
											hour: 'numeric',
											minute: '2-digit',
											hour12: true
										})}
									</span>
									<span class="text-xs text-muted-foreground">
										{new Date(row.timestamp).toLocaleDateString('en-US', {
											month: 'short',
											day: 'numeric',
											year: 'numeric'
										})}
									</span>
								</div>
							</Table.Cell>
							<Table.Cell>
								<Badge variant={badge.variant} class={badge.class}>
									{badge.label}
								</Badge>
							</Table.Cell>
							<Table.Cell>
								{#if row.ip_address}
									<span
										class="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono text-xs"
									>
										{row.ip_address}
									</span>
								{:else}
									<span class="text-muted-foreground">—</span>
								{/if}
							</Table.Cell>
							<Table.Cell class="max-w-[400px]">
								<p class="truncate text-sm font-medium">{row.details}</p>
							</Table.Cell>
							<Table.Cell class="text-right">
								<Button
									variant="outline"
									size="sm"
									class="gap-1.5"
									onclick={(e: Event) => {
										e.stopPropagation();
										table.openDetails(row);
									}}
								>
									View Details
									<ArrowRight class="size-3.5" />
								</Button>
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<Pagination {table} />
</main>

<AuditLogDetailsSheet data={table.selectedLog} bind:sheetOpen={table.sheetOpen} />
