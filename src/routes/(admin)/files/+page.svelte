<script lang="ts">
	import { ClientFolderState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import ClientFolderCard from '$lib/components/admin/files/ClientFolderCard.svelte';
	import FilesToolbar from '$lib/components/admin/files/FilesToolbar.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, FileText, HardDrive, RefreshCcw, Search, X } from '@lucide/svelte';
	import { untrack } from 'svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';

	let { data }: PageProps = $props();

	const STORAGE_LIMIT_BYTES = 1 * 1024 * 1024 * 1024; // 1 GB
	const usedBytes = $derived(data.storageSizeBytes ?? 0);
	const totalFilesCount = $derived(data.totalFilesCount ?? 0);
	const utilizationPercentage = $derived(
		usedBytes > 0 ? Math.max(0.1, Number(((usedBytes / STORAGE_LIMIT_BYTES) * 100).toFixed(1))) : 0
	);

	function formatBytes(bytes: number): string {
		if (bytes === 0) return '0.0 B';
		const units = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(1024));
		return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
	}

	const formattedUsed = $derived(formatBytes(usedBytes));
	const formattedLimit = $derived(formatBytes(STORAGE_LIMIT_BYTES));

	const clientsWithDisplayName = $derived(
		(data.clients ?? []).map((client) => {
			const isCompany = client.company_name && !client.is_individual;
			const displayName = isCompany
				? client.company_name || ''
				: [client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ');
			return {
				...client,
				displayName
			};
		})
	);

	const profile = $derived(data.profile);
	const isSystemAdmin = $derived(profile?.role === 'System Admin');
	const userRole = $derived(profile?.role ?? null);

	const table = new ClientFolderState(untrack(() => clientsWithDisplayName));

	$effect(() => {
		table.rows = clientsWithDisplayName;
	});

	function toggleSort() {
		table.sortDirection = table.sortDirection === 'asc' ? 'desc' : 'asc';
	}
</script>

<main class="p-4">
	<div class="mb-4 flex flex-wrap items-center gap-2">
		<Button
			variant="outline"
			size="icon"
			disabled={table.isRefreshing}
			onclick={() => table.handleRefresh('db:client-profiles')}
			class="h-10 w-10 shrink-0 rounded-lg border-border"
		>
			<RefreshCcw class="size-4 {table.isRefreshing ? 'animate-spin' : ''}" />
		</Button>
		<div class="relative max-w-md flex-1">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={table.searchValue}
				type="search"
				placeholder="Search for client"
				class="h-10 rounded-lg border-border pl-9"
				oninput={() => {
					table.currentPage = 1;
				}}
			/>
		</div>
		<FilesToolbar {table} {isSystemAdmin} {userRole} />
	</div>

	<!-- Active Filters indicator -->
	{#if table.selectedType !== 'all' || (isSystemAdmin && table.selectedTeam !== 'all')}
		<div class="mb-4 flex flex-wrap items-center gap-2">
			<span class="text-xs font-medium text-muted-foreground">Active filters:</span>
			{#if table.selectedType !== 'all'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-all duration-300 hover:bg-primary/15"
				>
					Type: {table.selectedType === 'individual' ? 'Individual' : 'Company'}
					<button
						onclick={() => {
							table.selectedType = 'all';
							table.currentPage = 1;
						}}
						class="rounded-full p-0.5 transition-colors hover:bg-primary/20"
						aria-label="Remove type filter"
					>
						<X class="size-3" />
					</button>
				</span>
			{/if}
			{#if isSystemAdmin && table.selectedTeam !== 'all'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-all duration-300 hover:bg-primary/15"
				>
					Team: {table.selectedTeam}
					<button
						onclick={() => {
							table.selectedTeam = 'all';
							table.currentPage = 1;
						}}
						class="rounded-full p-0.5 transition-colors hover:bg-primary/20"
						aria-label="Remove team filter"
					>
						<X class="size-3" />
					</button>
				</span>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-auto p-0 text-xs font-semibold text-muted-foreground hover:text-foreground"
				onclick={() => {
					table.selectedType = 'all';
					table.selectedTeam = 'all';
					table.currentPage = 1;
				}}
			>
				Clear all
			</Button>
		</div>
	{/if}

	<!-- Storage Utilization & Total Files Cards -->
	<div class="mb-6 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-2">
		<!-- Storage Utilization Card -->
		<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Description class="text-xs font-semibold tracking-wider uppercase"
					>Storage Utilization</Card.Description
				>
				<HardDrive class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<Card.Title class="text-3xl font-bold tracking-tight text-foreground"
					>{utilizationPercentage}%</Card.Title
				>
				<p class="mt-1.5 text-xs font-medium text-muted-foreground">
					{formattedUsed} / {formattedLimit}
				</p>
			</Card.Content>
		</Card.Root>

		<!-- Total Files Stored Card -->
		<Card.Root class="transition-shadow duration-300 hover:shadow-lg">
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Description class="text-xs font-semibold tracking-wider uppercase"
					>Total Files Stored</Card.Description
				>
				<FileText class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<Card.Title class="text-3xl font-bold tracking-tight text-foreground"
					>{totalFilesCount}</Card.Title
				>
				<p class="mt-1.5 text-xs font-medium text-muted-foreground">Files in secure storage</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Sort indicator / trigger -->
	<button class="mb-4 flex w-fit items-center gap-1 text-sm font-medium" onclick={toggleSort}>
		Name
		<span class="text-xs">{table.sortDirection === 'asc' ? '↑' : '↓'}</span>
	</button>

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
