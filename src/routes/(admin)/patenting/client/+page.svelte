<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Checkbox } from '$lib/shadcn/components/ui/checkbox/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as Tabs from '$lib/shadcn/components/ui/tabs/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import {
		ArrowUpDown,
		ChevronRight,
		Download,
		Ellipsis,
		ListFilter,
		Plus,
		Search
	} from '@lucide/svelte';
	import type { IpApplicationRow } from './+page.server';
	import type { IpApplicationStatus } from '$lib/types/ip-application';

	let { data } = $props();

	let searchValue = $state('');

	$effect(() => {
		searchValue = data.search;
	});

	function updateParams(updates: Record<string, string | number>) {
		const params = new URLSearchParams($page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === '' || value === null || value === undefined) {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		if (!('page' in updates)) {
			params.set('page', '1');
		}
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function handleSearch() {
		updateParams({ search: searchValue });
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	function handleTabChange(value: string) {
		updateParams({ status: value });
	}

	function handleSort(column: string) {
		const newDir = data.sortColumn === column && data.sortDirection === 'asc' ? 'desc' : 'asc';
		updateParams({ sort: column, dir: newDir });
	}

	function goToPage(p: number) {
		if (p < 1 || p > data.totalPages) return;
		updateParams({ page: p });
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getClientName(app: IpApplicationRow): string {
		const parts = [app.client_first_name, app.client_last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : '—';
	}

	type StatusConfig = { dot: string; badge: string };

	const STATUS_STYLES: Record<IpApplicationStatus, StatusConfig> = {
		Assigned: { dot: 'bg-blue-500', badge: 'text-blue-700 border-blue-200 bg-blue-50' },
		Extended: { dot: 'bg-amber-500', badge: 'text-amber-700 border-amber-200 bg-amber-50' },
		Submitted: { dot: 'bg-violet-500', badge: 'text-violet-700 border-violet-200 bg-violet-50' },
		'For Pickup': {
			dot: 'bg-emerald-500',
			badge: 'text-emerald-700 border-emerald-200 bg-emerald-50'
		},
		Closed: { dot: 'bg-slate-400', badge: 'text-slate-600 border-slate-200 bg-slate-50' }
	};

	function getStatusStyle(status: IpApplicationStatus): StatusConfig {
		return (
			STATUS_STYLES[status] ?? {
				dot: 'bg-slate-400',
				badge: 'text-slate-600 border-slate-200 bg-slate-50'
			}
		);
	}

	function getPageNumbers(current: number, total: number): (number | '...')[] {
		if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
		const pages: (number | '...')[] = [];
		if (current <= 4) {
			pages.push(1, 2, 3, 4, '...', total - 2, total - 1, total);
		} else if (current >= total - 3) {
			pages.push(1, 2, 3, '...', total - 3, total - 2, total - 1, total);
		} else {
			pages.push(1, '...', current - 1, current, current + 1, '...', total);
		}
		return pages;
	}

	const activeTab = $derived(data.status || 'all');
	const pageNumbers = $derived(getPageNumbers(data.page, data.totalPages));
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Patenting of Client</h1>
			<p class="mt-1 text-muted-foreground">Manage client patenting records.</p>
		</div>
		<div class="flex items-center gap-3">
			<Button variant="outline" class="gap-2">
				<Download class="size-4" />
				Export as
			</Button>
			<Button class="gap-2">
				<Plus class="size-4" />
				New application
			</Button>
		</div>
	</div>

	<!-- Count -->
	<div class="flex items-center gap-2">
		<h2 class="text-lg font-semibold">All applications</h2>
		<span class="text-lg text-muted-foreground">{data.totalCount}</span>
	</div>

	<!-- Tabs and Search -->
	<div class="flex items-center justify-between gap-4">
		<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
			<Tabs.List>
				<Tabs.Trigger value="all">View all</Tabs.Trigger>
				<Tabs.Trigger value="Assigned">Assigned</Tabs.Trigger>
				<Tabs.Trigger value="Submitted">Submitted</Tabs.Trigger>
				<Tabs.Trigger value="Extended">Extended</Tabs.Trigger>
				<Tabs.Trigger value="For Pickup">For Pickup</Tabs.Trigger>
				<Tabs.Trigger value="Closed">Closed</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		<div class="flex items-center gap-3">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search"
					class="w-60 pl-9"
					bind:value={searchValue}
					onkeydown={handleSearchKeydown}
				/>
			</div>
			<Button variant="outline" class="gap-2">
				<ListFilter class="size-4" />
				Filters
			</Button>
		</div>
	</div>

	<!-- Table -->
	<div class="rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-12">
						<Checkbox />
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('application_number')}
						>
							App. No.
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('title_of_invention')}
						>
							Title of Invention
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>Client</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('status')}
						>
							Status
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('filling_date')}
						>
							Filing Date
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('deadline')}
						>
							Deadline
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head class="w-10"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.applications.length === 0}
					<Table.Row>
						<Table.Cell colspan={8} class="py-12 text-center text-muted-foreground">
							No applications found.
						</Table.Cell>
					</Table.Row>
				{/if}
				{#each data.applications as app (app.application_number)}
					<Table.Row class="h-16">
						<Table.Cell>
							<Checkbox />
						</Table.Cell>
						<Table.Cell class="font-mono text-sm font-medium">
							{app.application_number}
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-col">
								<span class="text-sm font-medium">{app.title_of_invention}</span>
								{#if app.type_of_invention_name}
									<span class="text-xs text-muted-foreground">{app.type_of_invention_name}</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-col">
								<span class="text-sm">{getClientName(app)}</span>
								{#if app.client_email}
									<span class="text-xs text-muted-foreground">{app.client_email}</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell>
							{@const style = getStatusStyle(app.status)}
							<Badge variant="outline" class="gap-1.5 font-normal {style.badge}">
								<span class="size-1.5 rounded-full {style.dot}"></span>
								{app.status}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">
							{formatDate(app.filling_date)}
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">
							{formatDate(app.deadline)}
						</Table.Cell>
						<Table.Cell>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button variant="ghost" size="icon" class="size-8">
										<Ellipsis class="size-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item>View details</DropdownMenu.Item>
									<DropdownMenu.Item>Edit application</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	{#if data.totalPages > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Page {data.page} of {data.totalPages}
			</p>
			<div class="flex items-center gap-1">
				{#each pageNumbers as p}
					{#if p === '...'}
						<span class="px-2 text-sm text-muted-foreground">...</span>
					{:else}
						<Button
							variant={p === data.page ? 'default' : 'outline'}
							size="sm"
							class="size-8"
							onclick={() => goToPage(p as number)}
						>
							{p}
						</Button>
					{/if}
				{/each}
				<Button
					variant="outline"
					size="sm"
					class="ml-2 gap-1"
					disabled={data.page >= data.totalPages}
					onclick={() => goToPage(data.page + 1)}
				>
					Next
					<ChevronRight class="size-4" />
				</Button>
			</div>
		</div>
	{/if}
</div>
