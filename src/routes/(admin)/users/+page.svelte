<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Checkbox } from '$lib/shadcn/components/ui/checkbox/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as Avatar from '$lib/shadcn/components/ui/avatar/index.js';
	import * as Tabs from '$lib/shadcn/components/ui/tabs/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import {
		ArrowUpDown,
		ChevronLeft,
		ChevronRight,
		Download,
		Ellipsis,
		ListFilter,
		Plus,
		Search,
		UserPlus
	} from '@lucide/svelte';
	import type { AdminUser } from './+page.server';

	let { data } = $props();

	let searchValue = $state('');

	// Sync searchValue when data changes (e.g. navigation)
	$effect(() => {
		searchValue = data.search;
	});

	/** Build URL with updated search params */
	function updateParams(updates: Record<string, string | number>) {
		const params = new URLSearchParams($page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === '' || value === null || value === undefined) {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		// Reset page to 1 when filters change (unless explicitly setting page)
		if (!('page' in updates)) {
			params.set('page', '1');
		}
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function handleSearch() {
		updateParams({ search: searchValue });
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			handleSearch();
		}
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

	function getInitials(user: AdminUser): string {
		const first = user.first_name?.[0] ?? '';
		const last = user.last_name?.[0] ?? '';
		if (first || last) return `${first}${last}`.toUpperCase();
		return user.email[0].toUpperCase();
	}

	function getDisplayName(user: AdminUser): string {
		if (user.first_name || user.last_name) {
			return [user.first_name, user.last_name].filter(Boolean).join(' ');
		}
		return user.email.split('@')[0];
	}

	function getRoleBadges(user: AdminUser): string[] {
		const badges: string[] = [];
		if (user.role === 'admin') badges.push('Admin');
		badges.push('Data Export', 'Data Import');
		return badges;
	}

	/** Generate page numbers to display with ellipsis */
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
		<div></div>
		<div class="flex items-center gap-3">
			<Button variant="outline" class="gap-2">
				<Download class="size-4" />
				Export as
			</Button>
			<Button class="gap-2">
				<Plus class="size-4" />
				Add user
			</Button>
		</div>
	</div>

	<!-- User count -->
	<div class="flex items-center gap-2">
		<h2 class="text-lg font-semibold">All users</h2>
		<span class="text-lg text-muted-foreground">{data.totalCount}</span>
	</div>

	<!-- Tabs and Search -->
	<div class="flex items-center justify-between gap-4">
		<Tabs.Root value={activeTab} onValueChange={handleTabChange}>
			<Tabs.List>
				<Tabs.Trigger value="all">View all</Tabs.Trigger>
				<Tabs.Trigger value="active">Active</Tabs.Trigger>
				<Tabs.Trigger value="inactive">Inactive</Tabs.Trigger>
			</Tabs.List>
		</Tabs.Root>

		<div class="flex items-center gap-3">
			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search"
					class="w-50 pl-9"
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
	<div class="overflow-x-auto rounded-lg border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-12">
						<Checkbox />
					</Table.Head>
					<Table.Head>
						<button class="flex items-center gap-1 font-medium" onclick={() => handleSort('name')}>
							User name
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button class="flex items-center gap-1 font-medium" onclick={() => handleSort('role')}>
							Access
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('last_active')}
						>
							Last active
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head>
						<button
							class="flex items-center gap-1 font-medium"
							onclick={() => handleSort('created_at')}
						>
							Date added
							<ArrowUpDown class="size-3" />
						</button>
					</Table.Head>
					<Table.Head class="w-10"></Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if data.users.length === 0}
					<Table.Row>
						<Table.Cell colspan={6} class="py-12 text-center text-muted-foreground">
							No users found.
						</Table.Cell>
					</Table.Row>
				{/if}
				{#each data.users as user (user.user_id)}
					<Table.Row class="h-16">
						<Table.Cell>
							<Checkbox />
						</Table.Cell>
						<Table.Cell>
							<div class="flex items-center gap-3">
								<Avatar.Root class="size-9">
									<Avatar.Fallback class="text-xs">{getInitials(user)}</Avatar.Fallback>
								</Avatar.Root>
								<div class="flex flex-col">
									<span class="text-sm font-medium">{getDisplayName(user)}</span>
									<span class="text-xs text-muted-foreground">{user.email}</span>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell>
							<div class="flex flex-wrap items-center gap-1.5">
								{#each getRoleBadges(user) as badge}
									<Badge variant="outline" class="gap-1.5 font-normal">
										<span
											class="size-1.5 rounded-full {badge === 'Admin'
												? 'bg-emerald-500'
												: 'bg-blue-500'}"
										></span>
										{badge}
									</Badge>
								{/each}
							</div>
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">
							{formatDate(user.last_active)}
						</Table.Cell>
						<Table.Cell class="text-sm text-muted-foreground">
							{formatDate(user.date_added)}
						</Table.Cell>
						<Table.Cell>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button variant="ghost" size="icon" class="size-8">
										<Ellipsis class="size-4" />
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item>View profile</DropdownMenu.Item>
									<DropdownMenu.Item>Edit user</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item class="text-destructive">
										{user.is_active ? 'Deactivate' : 'Activate'}
									</DropdownMenu.Item>
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
