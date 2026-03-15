<script lang="ts">
	import { AuditLogTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, RefreshCcw, Search } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import { formatTimestamp } from '$lib/utils/formatter';

	let { data }: PageProps = $props();

	const table = new AuditLogTableState(untrack(() => data.logs));

	$effect(() => {
		table.rows = data.logs;
	});
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
					<Table.Head class="min-w-[300px]">Details</Table.Head>
					<Table.Head>Old Value</Table.Head>
					<Table.Head>New Value</Table.Head>
					<Table.Head class="min-w-[180px]">Timestamp</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.error}
					<Table.Row>
						<Table.Cell colspan={4} class="py-12">
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
						<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
							Getting the latest audit logs...
						</Table.Cell>
					</Table.Row>
				{:else if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
							No audit logs found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.paginatedRows as row (row.log_id)}
						<Table.Row>
							<Table.Cell class="font-medium">{row.details}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{row.old_value ?? '—'}</Table.Cell>
							<Table.Cell class="text-muted-foreground">{row.new_value ?? '—'}</Table.Cell>
							<Table.Cell class="text-sm text-muted-foreground">
								{formatTimestamp(row.timestamp)}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<Pagination {table} />
</main>
