<script lang="ts">
	import { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import ApplicationTableRow from '$lib/components/admin/patenting-client/ApplicationTableRow.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import {
		AlertCircle,
		ListFilter,
		RefreshCcw,
		Search,
		ArrowUpDown,
		ArrowUp,
		ArrowDown,
		FileQuestion
	} from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import ApplicationSheet from '$lib/components/admin/patenting-client/ApplicationSheet.svelte';
	import * as Popover from '$lib/shadcn/components/ui/popover/index.js';
	import { APPLICATION_STATUS } from '$lib/constants/SchemaData';
	import { slide } from 'svelte/transition';
	import { untrack } from 'svelte';
	import { page } from '$app/state';
	import { hasPermission } from '$lib/services/permissions';
	let { data }: PageProps = $props();

	const permissions = $derived(page.data.permissions as string[]);
	const canEditApp = $derived(hasPermission(permissions, 'applications.edit'));

	const table = new ApplicationTableState(untrack(() => data.applications));

	$effect(() => {
		table.rows = data.applications;
	});

	const uniqueInventionTypes = $derived(
		Array.from(
			new Set(
				data.applications
					.map((app) => app.type_of_invention?.name)
					.filter((name): name is string => typeof name === 'string' && name.trim() !== '')
			)
		).sort()
	);
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
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="relative gap-2">
						<ListFilter class="size-4" /> Filters
						{#if table.selectedStatus !== 'all' || table.selectedType !== 'all'}
							<span
								class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground shadow-sm"
							>
								{(table.selectedStatus !== 'all' ? 1 : 0) + (table.selectedType !== 'all' ? 1 : 0)}
							</span>
						{/if}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-80 p-4" align="start">
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b pb-2">
						<h4 class="text-sm font-semibold">Filter Applications</h4>
						{#if table.selectedStatus !== 'all' || table.selectedType !== 'all'}
							<Button
								variant="ghost"
								size="sm"
								class="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
								onclick={() => {
									table.selectedStatus = 'all';
									table.selectedType = 'all';
									table.currentPage = 1;
								}}
							>
								Clear all
							</Button>
						{/if}
					</div>

					<div class="space-y-2">
						<label for="status-filter" class="text-xs font-medium text-muted-foreground"
							>Status</label
						>
						<select
							id="status-filter"
							class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							bind:value={table.selectedStatus}
							onchange={() => {
								table.currentPage = 1;
							}}
						>
							<option value="all">All Statuses</option>
							{#each APPLICATION_STATUS as status (status)}
								<option value={status}>{status}</option>
							{/each}
						</select>
					</div>

					<div class="space-y-2">
						<label for="type-filter" class="text-xs font-medium text-muted-foreground"
							>Type of Invention</label
						>
						<select
							id="type-filter"
							class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							bind:value={table.selectedType}
							onchange={() => {
								table.currentPage = 1;
							}}
						>
							<option value="all">All Types</option>
							{#each uniqueInventionTypes as type (type)}
								<option value={type}>{type}</option>
							{/each}
						</select>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
		<Button
			variant={table.showOnlyMissingAppNum ? 'secondary' : 'outline'}
			class="gap-2 transition-all duration-300 {table.showOnlyMissingAppNum
				? 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60'
				: ''}"
			onclick={() => {
				table.showOnlyMissingAppNum = !table.showOnlyMissingAppNum;
				table.currentPage = 1;
			}}
		>
			<FileQuestion class="size-4" />
			<span>No App #</span>
		</Button>
	</div>

	{#if table.selectedStatus !== 'all' || table.selectedType !== 'all' || table.showOnlyMissingAppNum}
		<div class="mt-2 flex flex-wrap items-center gap-2" transition:slide|local>
			<span class="mr-1 text-xs font-medium text-muted-foreground">Active filters:</span>
			{#if table.selectedStatus !== 'all'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-all duration-300 hover:bg-primary/15"
				>
					Status: {table.selectedStatus}
					<button
						onclick={() => {
							table.selectedStatus = 'all';
							table.currentPage = 1;
						}}
						class="rounded-full p-0.5 transition-colors hover:bg-primary/20"
						aria-label="Remove status filter"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</span>
			{/if}
			{#if table.selectedType !== 'all'}
				<span
					class="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary transition-all duration-300 hover:bg-primary/15"
				>
					Type: {table.selectedType}
					<button
						onclick={() => {
							table.selectedType = 'all';
							table.currentPage = 1;
						}}
						class="rounded-full p-0.5 transition-colors hover:bg-primary/20"
						aria-label="Remove type filter"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</span>
			{/if}
			{#if table.showOnlyMissingAppNum}
				<span
					class="inline-flex animate-in items-center gap-1.5 rounded-full border border-amber-300 bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 transition-all duration-200 duration-300 zoom-in-95 fade-in hover:bg-amber-100 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300"
				>
					Missing App #
					<button
						onclick={() => {
							table.showOnlyMissingAppNum = false;
							table.currentPage = 1;
						}}
						class="rounded-full p-0.5 transition-colors hover:bg-amber-200 dark:hover:bg-amber-900/40"
						aria-label="Remove missing app number filter"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-3 w-3"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2.2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</span>
			{/if}
			<Button
				variant="ghost"
				size="sm"
				class="h-7 px-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground"
				onclick={() => {
					table.selectedStatus = 'all';
					table.selectedType = 'all';
					table.showOnlyMissingAppNum = false;
					table.currentPage = 1;
				}}
			>
				Reset all
			</Button>
		</div>
	{/if}

	<div class="my-4">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
							onclick={() => table.toggleSort('application_number')}
						>
							Application #
							{#if table.sortColumn === 'application_number'}
								{#if table.sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-primary" />
								{:else}
									<ArrowDown class="size-3.5 text-primary" />
								{/if}
							{:else}
								<ArrowUpDown class="size-3.5 text-muted-foreground opacity-50" />
							{/if}
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 text-left font-semibold transition-colors hover:text-foreground"
							onclick={() => table.toggleSort('title_of_invention')}
						>
							Title of Invention
							{#if table.sortColumn === 'title_of_invention'}
								{#if table.sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-primary" />
								{:else}
									<ArrowDown class="size-3.5 text-primary" />
								{/if}
							{:else}
								<ArrowUpDown class="size-3.5 text-muted-foreground opacity-50" />
							{/if}
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
							onclick={() => table.toggleSort('client_profiles.first_name')}
						>
							Client
							{#if table.sortColumn === 'client_profiles.first_name'}
								{#if table.sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-primary" />
								{:else}
									<ArrowDown class="size-3.5 text-primary" />
								{/if}
							{:else}
								<ArrowUpDown class="size-3.5 text-muted-foreground opacity-50" />
							{/if}
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
							onclick={() => table.toggleSort('status')}
						>
							Status
							{#if table.sortColumn === 'status'}
								{#if table.sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-primary" />
								{:else}
									<ArrowDown class="size-3.5 text-primary" />
								{/if}
							{:else}
								<ArrowUpDown class="size-3.5 text-muted-foreground opacity-50" />
							{/if}
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-semibold transition-colors hover:text-foreground"
							onclick={() => table.toggleSort('created_at')}
						>
							Date Created
							{#if table.sortColumn === 'created_at'}
								{#if table.sortDirection === 'asc'}
									<ArrowUp class="size-3.5 text-primary" />
								{:else}
									<ArrowDown class="size-3.5 text-primary" />
								{/if}
							{:else}
								<ArrowUpDown class="size-3.5 text-muted-foreground opacity-50" />
							{/if}
						</button>
					</Table.Head>
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
									onclick={() => table.handleRefresh('db:ip-applications')}
								>
									Try Again
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else if table.isRefreshing}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
							Getting the latest applications update...
						</Table.Cell>
					</Table.Row>
				{:else if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
							No applications found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.paginatedRows as row (row.application_id)}
						<ApplicationTableRow app={row} canEdit={canEditApp} openDetails={table.openDetails} />
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
	<Pagination {table} />
</main>

<ApplicationSheet data={table.seletecApplication} bind:sheetOpen={table.sheetOpen} />
