<script lang="ts">
	import { ClientFolderState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import ClientFolderCard from '$lib/components/admin/files/ClientFolderCard.svelte';
	import FilesToolbar from '$lib/components/admin/files/FilesToolbar.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, RefreshCcw, Search } from '@lucide/svelte';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	const table = new ClientFolderState(untrack(() => data.clients));

	function toggleSort() {
		table.sortDirection = table.sortDirection === 'asc' ? 'desc' : 'asc';
	}
</script>

<main class="p-4">
	<div class="mb-4 flex items-center gap-2">
		<Button
			variant="outline"
			size="icon"
			disabled={table.isRefreshing}
			onclick={() => table.handleRefresh('db:client-profiles')}
		>
			<RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" />
		</Button>
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
	</div>

	<FilesToolbar sortDirection={table.sortDirection} onToggleSort={toggleSort} />

	<div class="my-4">
		{#if data.error}
			<div class="flex flex-col items-center justify-center space-y-3 py-12 text-center">
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
		{:else if table.isRefreshing}
			<p class="py-12 text-center text-muted-foreground">Loading client folders...</p>
		{:else if table.totalRows === 0}
			<p class="py-12 text-center text-muted-foreground">No client folders found.</p>
		{:else}
			<div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
				{#each table.paginatedRows as client (client.client_id)}
					<ClientFolderCard {client} />
				{/each}
			</div>
		{/if}
	</div>

	<Pagination {table} />
</main>
