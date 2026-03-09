<script lang="ts">
	import { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import ApplicationTableRow from '$lib/components/admin/patenting-client/ApplicationTableRow.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { ListFilter, RefreshCcw, Search } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import ApplicationSheet from '$lib/components/admin/patenting-client/ApplicationSheet.svelte';
	let { data }: PageProps = $props();

	const table = new ApplicationTableState(data.applications);
</script>

<main class="p-2">
	<h1>Client Applications</h1>
	<div class="flex gap-2">
		<Button
			variant="outline"
			size="icon"
			disabled={table.isRefreshing}
			onclick={() => table.handleRefresh('db:ip-applications')}
			><RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" /></Button
		>
		<div class="relative">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={table.searchValue}
				type="search"
				placeholder="Search for application"
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
					<Table.Head>Application #</Table.Head>
					<Table.Head>Title of Invention</Table.Head>
					<Table.Head>Client</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={8} class="py-12 text-center text-muted-foreground">
							No applications found.
						</Table.Cell>
					</Table.Row>
				{:else if table.isRefreshing}
					<Table.Row>
						<Table.Cell colspan={8} class="py-12 text-center text-muted-foreground">
							Getting the latest applications update...
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.paginatedRows as row (row.application_number)}
						<ApplicationTableRow app={row} openDetails={table.openDetails} />
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<Pagination {table} />
</main>

<ApplicationSheet data={table.seletecApplication} bind:sheetOpen={table.sheetOpen} />
