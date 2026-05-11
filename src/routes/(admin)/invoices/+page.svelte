<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import { invalidate, goto } from '$app/navigation';
	import { RefreshCw, Plus, Receipt, TrendingUp, Send, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index';
	import { hasPermission } from '$lib/services/permissions';

	let { data }: PageProps = $props();

	const permissions = $derived($page.data.permissions as string[]);
	const canCreateInvoice = $derived(hasPermission(permissions, 'invoices.create'));
	let isRefreshing = $state(false);
	let searchQuery = $state('');
	let statusFilter = $state('all');

	const statusColors: Record<string, string> = {
		Draft: 'bg-muted text-muted-foreground',
		Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		'Partially Paid': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
		Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
		Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
		Cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
	};

	function getClientName(inv: (typeof data.invoices)[0]): string {
		const cp = inv.client_profiles;
		if (!cp) return '—';
		if (cp.is_individual) {
			return [cp.first_name, cp.last_name].filter(Boolean).join(' ');
		}
		return cp.company_name || [cp.first_name, cp.last_name].filter(Boolean).join(' ');
	}

	const filteredInvoices = $derived(() => {
		let result = data.invoices;
		if (statusFilter !== 'all') {
			result = result.filter((inv) => inv.status === statusFilter);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			result = result.filter(
				(inv) =>
					inv.invoice_number?.toLowerCase().includes(q) ||
					getClientName(inv).toLowerCase().includes(q) ||
					inv.ip_applications?.title_of_invention?.toLowerCase().includes(q)
			);
		}
		return result;
	});

	function formatCurrency(val: number | string | null): string {
		const num = Number(val ?? 0);
		return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function getBalance(inv: (typeof data.invoices)[0]): number {
		return Number(inv.total_amount) - Number(inv.amount_paid) - Number(inv.ewt_amount);
	}

	async function handleRefresh() {
		isRefreshing = true;
		await invalidate('db:invoices');
		setTimeout(() => {
			isRefreshing = false;
		}, 600);
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Invoices</h1>
			<p class="text-sm text-muted-foreground">Manage BIR-compliant invoices and track payments</p>
		</div>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="gap-2"
				onclick={handleRefresh}
				disabled={isRefreshing}
			>
				<RefreshCw class="size-4! {isRefreshing ? 'animate-spin' : ''}" />
				{isRefreshing ? 'Refreshing...' : 'Refresh'}
			</Button>
			<Button
				size="sm"
				class="gap-2"
				onclick={() => goto('/invoices/new')}
				disabled={!canCreateInvoice}
			>
				<Plus class="size-4!" />
				New Invoice
			</Button>
		</div>
	</div>

	<!-- Stats Cards -->
	<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Total Outstanding</Card.Title>
				<Receipt class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatCurrency(data.stats.totalOutstanding)}</div>
				<p class="text-xs text-muted-foreground">Unpaid invoice balance</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Revenue This Month</Card.Title>
				<TrendingUp class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{formatCurrency(data.stats.revenueThisMonth)}</div>
				<p class="text-xs text-muted-foreground">{data.currentMonth}</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Invoices Sent</Card.Title>
				<Send class="size-4 text-muted-foreground" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold">{data.stats.invoicesSentThisMonth}</div>
				<p class="text-xs text-muted-foreground">This month</p>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Header class="flex flex-row items-center justify-between space-y-0 pb-2">
				<Card.Title class="text-sm font-medium">Overdue</Card.Title>
				<AlertTriangle class="size-4 text-destructive" />
			</Card.Header>
			<Card.Content>
				<div class="text-2xl font-bold {data.stats.overdueCount > 0 ? 'text-destructive' : ''}">
					{data.stats.overdueCount}
				</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.overdueCount > 0 ? 'Requires attention' : 'All invoices current'}
				</p>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-center">
		<Input placeholder="Search invoices..." class="sm:max-w-xs" bind:value={searchQuery} />
		<select
			class="flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
			bind:value={statusFilter}
		>
			<option value="all">All Statuses</option>
			<option value="Draft">Draft</option>
			<option value="Sent">Sent</option>
			<option value="Partially Paid">Partially Paid</option>
			<option value="Paid">Paid</option>
			<option value="Overdue">Overdue</option>
			<option value="Cancelled">Cancelled</option>
		</select>
	</div>

	<!-- Invoice Table -->
	<div class="rounded-lg border bg-background">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Invoice #</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Client</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Application</th>
						<th class="px-4 py-3 text-left font-medium text-muted-foreground">Issue Date</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Total</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Paid</th>
						<th class="px-4 py-3 text-right font-medium text-muted-foreground">Balance</th>
						<th class="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredInvoices() as inv (inv.invoice_id)}
						<tr
							class="cursor-pointer border-b transition-colors hover:bg-muted/50"
							onclick={() => goto(`/invoices/${inv.invoice_id}`)}
						>
							<td class="px-4 py-3 font-mono text-xs font-medium">{inv.invoice_number}</td>
							<td class="px-4 py-3">{getClientName(inv)}</td>
							<td class="max-w-[200px] truncate px-4 py-3 text-muted-foreground">
								{inv.ip_applications?.title_of_invention ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{new Date(inv.issue_date).toLocaleDateString('en-US', {
									month: 'short',
									day: 'numeric',
									year: 'numeric'
								})}
							</td>
							<td class="px-4 py-3 text-right font-medium">{formatCurrency(inv.total_amount)}</td>
							<td class="px-4 py-3 text-right text-muted-foreground"
								>{formatCurrency(inv.amount_paid)}</td
							>
							<td class="px-4 py-3 text-right font-medium">
								{formatCurrency(getBalance(inv))}
							</td>
							<td class="px-4 py-3 text-center">
								<Badge class="text-xs {statusColors[inv.status] ?? ''}">{inv.status}</Badge>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="8" class="px-4 py-12 text-center text-muted-foreground">
								<div class="flex flex-col items-center gap-2">
									<Receipt class="size-8 text-muted-foreground/50" />
									<p>No invoices found</p>
									<Button variant="outline" size="sm" onclick={() => goto('/invoices/new')}>
										Create your first invoice
									</Button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
