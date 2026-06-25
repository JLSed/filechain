<script lang="ts">
	import { ClientTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import ClientTableRow from '$lib/components/admin/client/ClientTableRow.svelte';
	import Pagination from '$lib/components/global/Pagination.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import {
		AlertCircle,
		ListFilter,
		RefreshCcw,
		Search,
		ArrowUpDown,
		ArrowUp,
		ArrowDown
	} from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import * as Popover from '$lib/shadcn/components/ui/popover/index.js';
	import { slide } from 'svelte/transition';
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
		<Popover.Root>
			<Popover.Trigger>
				{#snippet child({ props })}
					<Button {...props} variant="outline" class="relative gap-2">
						<ListFilter class="size-4" /> Filters
						{#if table.selectedType !== 'all'}
							<span
								class="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none font-bold text-primary-foreground shadow-sm"
							>
								1
							</span>
						{/if}
					</Button>
				{/snippet}
			</Popover.Trigger>
			<Popover.Content class="w-80 p-4" align="start">
				<div class="space-y-4">
					<div class="flex items-center justify-between border-b pb-2">
						<h4 class="text-sm font-semibold">Filter Clients</h4>
						{#if table.selectedType !== 'all'}
							<Button
								variant="ghost"
								size="sm"
								class="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
								onclick={() => {
									table.selectedType = 'all';
									table.currentPage = 1;
								}}
							>
								Clear all
							</Button>
						{/if}
					</div>

					<div class="space-y-2">
						<label for="client-type-filter" class="text-xs font-medium text-muted-foreground"
							>Client Type</label
						>
						<select
							id="client-type-filter"
							class="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
							bind:value={table.selectedType}
							onchange={() => {
								table.currentPage = 1;
							}}
						>
							<option value="all">All Types</option>
							<option value="individual">Individual</option>
							<option value="company">Company</option>
						</select>
					</div>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>

	{#if table.selectedType !== 'all'}
		<div class="mt-2 flex flex-wrap items-center gap-2" transition:slide|local>
			<span class="mr-1 text-xs font-medium text-muted-foreground">Active filters:</span>
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
					aria-label="Remove client type filter"
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
			<Button
				variant="ghost"
				size="sm"
				class="h-7 px-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:text-foreground"
				onclick={() => {
					table.selectedType = 'all';
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
							onclick={() => table.toggleSort('first_name')}
						>
							Client Name
							{#if table.sortColumn === 'first_name'}
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
							onclick={() => table.toggleSort('is_individual')}
						>
							Type
							{#if table.sortColumn === 'is_individual'}
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
							onclick={() => table.toggleSort('email')}
						>
							Email
							{#if table.sortColumn === 'email'}
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
							onclick={() => table.toggleSort('mobile_number')}
						>
							Mobile Number
							{#if table.sortColumn === 'mobile_number'}
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
							Recorded Date
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
									onclick={() => table.handleRefresh('db:client-profiles')}
								>
									Try Again
								</Button>
							</div>
						</Table.Cell>
					</Table.Row>
				{:else if table.isRefreshing}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
							Getting the latest clients update...
						</Table.Cell>
					</Table.Row>
				{:else if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={5} class="py-12 text-center text-muted-foreground">
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
