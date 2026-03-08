<script lang="ts">
	import { invalidate } from '$app/navigation';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Checkbox } from '$lib/shadcn/components/ui/checkbox/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as Tabs from '$lib/shadcn/components/ui/tabs/index.js';

	import {
		ArrowUpDown,
		ChevronRight,
		Download,
		ListFilter,
		Plus,
		RefreshCw,
		Search
	} from '@lucide/svelte';
	import type { IpApplicationRow } from './+page.server';
	import type { IpApplicationStatus } from '$lib/types/filing-forms/ip-application.js';
	import type { StorageFile } from './files/+server';
	import TableRow from '$lib/components/client-patenting/TableRow.svelte';
	import ApplicationDetail from '$lib/components/client-patenting/ApplicationDetail.svelte';

	let { data } = $props();

	// ── Client-side filter / sort / pagination state ──
	let searchValue = $state('');
	let activeStatus = $state('all');
	let sortColumn = $state('filling_date');
	let sortDirection = $state<'asc' | 'desc'>('desc');
	let currentPage = $state(1);
	const MAX_PAGE_SIZE = 5;

	// ── Refresh state ──
	let isRefreshing = $state(false);

	async function handleRefresh() {
		isRefreshing = true;
		await invalidate('app:ip-applications');
		isRefreshing = false;
	}

	// ── Derived: filter → sort → slice ──
	const processedApplications = $derived.by(() => {
		const s = searchValue.trim().toLowerCase();
		let result = data.applications as IpApplicationRow[];

		if (s) {
			result = result.filter(
				(app) =>
					(app.title_of_invention ?? '').toLowerCase().includes(s) ||
					(app.application_number ?? '').toLowerCase().includes(s)
			);
		}

		if (activeStatus !== 'all') {
			result = result.filter((app) => app.status === activeStatus);
		}

		return [...result].sort((a, b) => {
			const aVal = String(a[sortColumn as keyof IpApplicationRow] ?? '');
			const bVal = String(b[sortColumn as keyof IpApplicationRow] ?? '');
			const cmp = aVal.localeCompare(bVal);
			return sortDirection === 'asc' ? cmp : -cmp;
		});
	});

	const totalRows = $derived(processedApplications.length);
	const maxRowPerPage = $derived(Math.ceil(totalRows / MAX_PAGE_SIZE));
	const paginatedRows = $derived(
		processedApplications.slice((currentPage - 1) * MAX_PAGE_SIZE, currentPage * MAX_PAGE_SIZE)
	);
	const activeTab = $derived(activeStatus);
	const pageNumbers = $derived(getPageNumbers(currentPage, maxRowPerPage));
	// Reset to page 1 whenever filters or sort change
	// (search reset is handled via oninput on the Input element)

	// ── Sheet state ──
	let sheetOpen = $state(false);
	let selectedApp = $state<IpApplicationRow | null>(null);
	let files = $state<StorageFile[]>([]);
	let filesLoading = $state(false);
	let filesError = $state<string | null>(null);

	async function openDetails(app: IpApplicationRow) {
		selectedApp = app;
		sheetOpen = true;

		// Fetch files for this application
		if (app.link_to_folder) {
			filesLoading = true;
			filesError = null;
			files = [];

			try {
				const res = await fetch(
					`/patenting/client/files?path=${encodeURIComponent(app.link_to_folder)}`
				);
				if (!res.ok) throw new Error('Failed to load files');
				const json = await res.json();
				files = json.files as StorageFile[];
			} catch (err) {
				filesError = err instanceof Error ? err.message : 'Unknown error';
			} finally {
				filesLoading = false;
			}
		} else {
			files = [];
		}
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') searchValue = '';
	}

	function handleTabChange(value: string) {
		activeStatus = value;
		currentPage = 1;
	}

	function handleSort(column: string) {
		if (sortColumn === column) {
			sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
		} else {
			sortColumn = column;
			sortDirection = 'asc';
		}
		currentPage = 1;
	}

	function goToPage(p: number) {
		if (p < 1 || p > maxRowPerPage) return;
		currentPage = p;
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
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold">Patenting of Client</h1>
			<p class="mt-1 text-muted-foreground">Manage client patenting records.</p>
		</div>
		<div class="flex items-center gap-3">
			<Button
				variant="outline"
				size="icon"
				title="Refresh data"
				disabled={isRefreshing}
				onclick={handleRefresh}
			>
				<RefreshCw class="size-4 {isRefreshing ? 'animate-spin' : ''}" />
			</Button>
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
		<span class="text-lg text-muted-foreground">{totalRows}</span>
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
					oninput={() => {
						currentPage = 1;
					}}
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
	<div class="overflow-x-auto rounded-lg border">
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
				{#if paginatedRows.length === 0}
					<Table.Row>
						<Table.Cell colspan={8} class="py-12 text-center text-muted-foreground">
							No applications found.
						</Table.Cell>
					</Table.Row>
				{/if}
				{#each paginatedRows as app (app.application_number)}
					<TableRow {app} {getClientName} {getStatusStyle} {formatDate} {openDetails} />
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	<!-- Pagination -->
	{#if maxRowPerPage > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-muted-foreground">
				Page {currentPage} of {maxRowPerPage}
			</p>
			<div class="flex items-center gap-1">
				{#each pageNumbers as p, i (i)}
					{#if p === '...'}
						<span class="px-2 text-sm text-muted-foreground">...</span>
					{:else}
						<Button
							variant={p === currentPage ? 'default' : 'outline'}
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
					disabled={currentPage >= maxRowPerPage}
					onclick={() => goToPage(currentPage + 1)}
				>
					Next
					<ChevronRight class="size-4" />
				</Button>
			</div>
		</div>
	{/if}
</div>

<!-- ── Application Details Sheet ── -->
<ApplicationDetail
	bind:sheetOpen
	{filesLoading}
	{filesError}
	{selectedApp}
	{getStatusStyle}
	{getClientName}
	{formatDate}
	{files}
/>
