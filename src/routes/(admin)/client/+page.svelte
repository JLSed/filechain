<script lang="ts">
	import { ClientTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import ClientTableRow from '$lib/components/admin/client/ClientTableRow.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { AlertCircle, ListFilter, RefreshCcw, Search } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	const table = new ClientTableState(untrack(() => data.clients));

	$effect(() => {
		table.rows = data.clients;
	});
</script>

<main class="p-2">
	<h1>Client Profiles</h1>
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="icon"
			disabled={table.isRefreshing}
			onclick={() => table.handleRefresh('db:client-profiles')}
			><RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" /></Button
		>
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={table.searchValue}
				type="search"
				placeholder="Search for client"
				class="max-w-lg pl-9"
				oninput={() => {
					table.currentPage = 1;
				}}
			/>
		</div>
		<Button variant="outline" class="gap-2">
			<ListFilter /> Filters
		</Button>
	</div>
	<div class="my-4">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Client Name</Table.Head>
					<Table.Head>Type</Table.Head>
					<Table.Head>Email</Table.Head>
					<Table.Head>Mobile Number</Table.Head>
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
									onclick={() => table.handleRefresh('db:client-profiles')}
								>
									Try Again
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else if table.isRefreshing}
					<Table.Row>
						<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
							Getting the latest clients update...
						</Table.Cell>
					</Table.Row>
				{:else if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
							No clients found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.paginatedRows as row (row.client_id)}
						<ClientTableRow client={row} />
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<Pagination {table} />
</main>
