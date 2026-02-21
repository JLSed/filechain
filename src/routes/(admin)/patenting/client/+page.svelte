<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Checkbox } from '$lib/shadcn/components/ui/checkbox/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as Tabs from '$lib/shadcn/components/ui/tabs/index.js';
	import * as ContextMenu from '$lib/shadcn/components/ui/context-menu/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import { Separator } from '$lib/shadcn/components/ui/separator/index.js';
	import {
		ArrowUpDown,
		ChevronDown,
		ChevronRight,
		Download,
		Ellipsis,
		Eye,
		File,
		FileJson,
		FileLock,
		FolderClosed,
		FolderOpen,
		ListFilter,
		Loader2,
		Pencil,
		Plus,
		Search
	} from '@lucide/svelte';
	import type { IpApplicationRow } from './+page.server';
	import type { IpApplicationStatus } from '$lib/types/ip-application';
	import type { StorageFile } from './files/+server';

	let { data } = $props();

	let searchValue = $state('');

	// ── Sheet state ──
	let sheetOpen = $state(false);
	let selectedApp = $state<IpApplicationRow | null>(null);
	let files = $state<StorageFile[]>([]);
	let filesLoading = $state(false);
	let filesError = $state<string | null>(null);
	let folderExpanded = $state(true);

	async function openDetails(app: IpApplicationRow) {
		selectedApp = app;
		sheetOpen = true;
		folderExpanded = true;

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

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function getFileIcon(name: string) {
		if (name.endsWith('.meta.json')) return FileJson;
		if (name.endsWith('.enc')) return FileLock;
		return File;
	}

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

	function formatCurrency(amount: number | null): string {
		if (amount == null) return '—';
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
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
					<ContextMenu.Root>
						<ContextMenu.Trigger>
							{#snippet child({ props })}
								<Table.Row {...props} class="h-16">
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
												<span class="text-xs text-muted-foreground"
													>{app.type_of_invention_name}</span
												>
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
												<DropdownMenu.Item onclick={() => openDetails(app)}>
													<Eye class="mr-2 size-4" />
													View details
												</DropdownMenu.Item>
												<DropdownMenu.Item>
													<Pencil class="mr-2 size-4" />
													Edit application
												</DropdownMenu.Item>
												<DropdownMenu.Separator />
												<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
											</DropdownMenu.Content>
										</DropdownMenu.Root>
									</Table.Cell>
								</Table.Row>
							{/snippet}
						</ContextMenu.Trigger>
						<ContextMenu.Content class="w-48">
							<ContextMenu.Item onclick={() => openDetails(app)}>
								<Eye class="mr-2 size-4" />
								View Details
							</ContextMenu.Item>
							<ContextMenu.Item>
								<Pencil class="mr-2 size-4" />
								Edit Application
							</ContextMenu.Item>
						</ContextMenu.Content>
					</ContextMenu.Root>
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

<!-- ── Application Details Sheet ── -->
<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="right" class="overflow-y-auto sm:max-w-xl">
		<Sheet.Header>
			<Sheet.Title class="text-lg">Application Details</Sheet.Title>
			<Sheet.Description>
				{#if selectedApp}
					{selectedApp.application_number}
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		{#if selectedApp}
			{@const app = selectedApp}
			<div class="flex flex-col gap-6 px-4 pb-8">
				<!-- Status badge -->
				{#if app.status}
					{@const style = getStatusStyle(app.status)}
					<div>
						<Badge variant="outline" class="gap-1.5 font-normal {style.badge}">
							<span class="size-1.5 rounded-full {style.dot}"></span>
							{app.status}
						</Badge>
					</div>
				{/if}

				<!-- Invention Info -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Invention
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Title of Invention</dt>
							<dd class="font-medium">{app.title_of_invention}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Type of Invention</dt>
							<dd class="font-medium">{app.type_of_invention_name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Pre-Protection Status</dt>
							<dd class="font-medium">{app.pre_protection_status_name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Office Action</dt>
							<dd class="font-medium">{app.type_of_office_action_name ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Inventor(s)</dt>
							<dd class="font-medium">
								{#if app.inventor_names && app.inventor_names.length > 0}
									{app.inventor_names.join(', ')}
								{:else}
									—
								{/if}
							</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<!-- Client Info -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Client
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Name</dt>
							<dd class="font-medium">{getClientName(app)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium">{app.client_email ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Contact Details</dt>
							<dd class="font-medium">{app.contact_details ?? '—'}</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<!-- Dates & Fees -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Dates &amp; Fees
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Filing Date</dt>
							<dd class="font-medium">{formatDate(app.filling_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Deadline</dt>
							<dd class="font-medium">{formatDate(app.deadline)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Mailing Date</dt>
							<dd class="font-medium">{formatDate(app.mailing_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Publication Date</dt>
							<dd class="font-medium">{formatDate(app.publication_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Paper Doc. No.</dt>
							<dd class="font-mono font-medium">{app.paper_document_no ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Fees</dt>
							<dd class="font-medium">{formatCurrency(app.fees)}</dd>
						</div>
					</dl>
				</section>

				{#if app.remarks}
					<Separator />
					<section>
						<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
							Remarks
						</h3>
						<p class="text-sm leading-relaxed">{app.remarks}</p>
					</section>
				{/if}

				<Separator />

				<!-- File Explorer -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Files
					</h3>

					{#if !app.link_to_folder}
						<p class="text-sm text-muted-foreground">No folder linked to this application.</p>
					{:else if filesLoading}
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 class="size-4 animate-spin" />
							Loading files…
						</div>
					{:else if filesError}
						<p class="text-sm text-destructive">{filesError}</p>
					{:else}
						<!-- Solution Explorer style tree -->
						<div class="rounded-md border bg-muted/30 font-mono text-sm">
							<!-- Folder root -->
							<button
								class="flex w-full items-center gap-1.5 px-3 py-2 text-left transition-colors hover:bg-muted/60"
								onclick={() => (folderExpanded = !folderExpanded)}
							>
								{#if folderExpanded}
									<ChevronDown class="size-3.5 shrink-0 text-muted-foreground" />
									<FolderOpen class="size-4 shrink-0 text-amber-500" />
								{:else}
									<ChevronRight class="size-3.5 shrink-0 text-muted-foreground" />
									<FolderClosed class="size-4 shrink-0 text-amber-500" />
								{/if}
								<span class="truncate font-semibold">{app.link_to_folder}</span>
								<span class="ml-auto shrink-0 text-xs text-muted-foreground">
									{files.length} item{files.length !== 1 ? 's' : ''}
								</span>
							</button>

							{#if folderExpanded}
								{#if files.length === 0}
									<div class="px-3 py-2 pl-10 text-muted-foreground italic">No files found</div>
								{:else}
									{#each files as file (file.name)}
										{@const Icon = getFileIcon(file.name)}
										<div
											class="group flex items-center gap-1.5 border-t border-border/50 px-3 py-1.5 pl-10 transition-colors hover:bg-muted/60"
										>
											<Icon
												class="size-4 shrink-0 {file.isMeta
													? 'text-sky-500'
													: 'text-muted-foreground'}"
											/>
											<span class="truncate">{file.name}</span>
											<span class="ml-auto shrink-0 text-xs text-muted-foreground">
												{formatFileSize(file.size)}
											</span>
										</div>
									{/each}
								{/if}
							{/if}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
