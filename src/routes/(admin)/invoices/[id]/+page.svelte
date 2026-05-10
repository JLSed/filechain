<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import { invalidate, goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Send, XCircle, BanknoteArrowDown } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import { PAYMENT_METHODS, EWT_RATES } from '$lib/constants/SchemaData';
	import { hasPermission } from '$lib/services/permissions';

	let { data }: PageProps = $props();

	const permissions = $derived($page.data.permissions as string[]);
	const canEditInvoice = $derived(hasPermission(permissions, 'invoices.edit'));
	let actionLoading = $state(false);

	// Payment dialog state
	let paymentDialogOpen = $state(false);
	let paymentAmount = $state(0);
	let paymentDate = $state(new Date().toISOString().split('T')[0]);
	let paymentMethod = $state<(typeof PAYMENT_METHODS)[number]>('Cash');
	let paymentEwtRate = $state(0);
	let paymentNotes = $state('');

	const inv = $derived(data.invoice);
	const lineItems = $derived(data.lineItems);
	const payments = $derived(data.payments);
	const company = $derived(data.companySettings);

	const statusColors: Record<string, string> = {
		Draft: 'bg-muted text-muted-foreground',
		Sent: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
		'Partially Paid': 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
		Paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
		Overdue: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
		Cancelled: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500'
	};

	const balance = $derived(
		Number(inv.total_amount) - Number(inv.amount_paid) - Number(inv.ewt_amount)
	);

	// Computed EWT for payment dialog
	const computedEwt = $derived(Math.round(paymentAmount * paymentEwtRate * 100) / 100);

	function getClientName(): string {
		const cp = inv.client_profiles;
		if (!cp) return '—';
		if (cp.is_individual) {
			return [cp.first_name, cp.middle_name, cp.last_name].filter(Boolean).join(' ');
		}
		return cp.company_name || [cp.first_name, cp.last_name].filter(Boolean).join(' ');
	}

	function formatCurrency(val: number | string | null): string {
		const num = Number(val ?? 0);
		return `₱${num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatDate(d: string | null): string {
		if (!d) return '—';
		return new Date(d).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	async function handleSendInvoice() {
		actionLoading = true;
		try {
			const formData = new FormData();
			formData.set('invoice_id', inv.invoice_id);
			formData.set('invoice_number', inv.invoice_number);

			const res = await fetch('?/sendInvoice', { method: 'POST', body: formData });
			const result = deserialize(await res.text());

			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Failed.');
				return;
			}
			toast.success('Invoice marked as sent.');
			await invalidate('db:invoice-detail');
		} finally {
			actionLoading = false;
		}
	}

	async function handleCancelInvoice() {
		if (!confirm('Are you sure you want to cancel this invoice?')) return;
		actionLoading = true;
		try {
			const formData = new FormData();
			formData.set('invoice_id', inv.invoice_id);
			formData.set('invoice_number', inv.invoice_number);

			const res = await fetch('?/cancelInvoice', { method: 'POST', body: formData });
			const result = deserialize(await res.text());

			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Failed.');
				return;
			}
			toast.success('Invoice cancelled.');
			await invalidate('db:invoice-detail');
		} finally {
			actionLoading = false;
		}
	}

	async function handleRecordPayment() {
		if (paymentAmount <= 0) {
			toast.error('Payment amount must be greater than 0.');
			return;
		}

		actionLoading = true;
		try {
			const payload = {
				invoice_id: inv.invoice_id,
				amount: paymentAmount,
				payment_date: paymentDate,
				payment_method: paymentMethod,
				ewt_rate: paymentEwtRate || null,
				ewt_amount: computedEwt,
				notes: paymentNotes
			};

			const formData = new FormData();
			formData.set('payload', JSON.stringify(payload));

			const res = await fetch('?/recordPayment', { method: 'POST', body: formData });
			const result = deserialize(await res.text());

			if (result.type === 'failure') {
				toast.error((result.data as { message?: string })?.message ?? 'Failed.');
				return;
			}

			let receiptNum = '';
			if (result.type === 'success') {
				receiptNum = (result.data as { receiptNumber?: string } | undefined)?.receiptNumber ?? '';
			}
			toast.success(`Payment recorded.${receiptNum ? ` Receipt: ${receiptNum}` : ''}`);
			paymentDialogOpen = false;
			paymentAmount = 0;
			paymentNotes = '';
			paymentEwtRate = 0;
			await invalidate('db:invoice-detail');
		} finally {
			actionLoading = false;
		}
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<div class="flex items-center gap-3">
			<Button variant="outline" size="icon" onclick={() => goto('/invoices')}>
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="font-mono text-lg font-bold">{inv.invoice_number}</h1>
					<Badge class="text-xs {statusColors[inv.status] ?? ''}">{inv.status}</Badge>
				</div>
				<p class="text-sm text-muted-foreground">
					Issued {formatDate(inv.issue_date)}
					{#if inv.due_date}
						· Due {formatDate(inv.due_date)}
					{/if}
				</p>
			</div>
		</div>

		<!-- Actions -->
		{#if inv.status !== 'Cancelled' && inv.status !== 'Paid'}
			<div class="flex items-center gap-2">
				{#if inv.status === 'Draft'}
					<Button
						variant="outline"
						size="sm"
						class="gap-2"
						onclick={handleSendInvoice}
						disabled={actionLoading || !canEditInvoice}
					>
						<Send class="size-4!" />
						Mark as Sent
					</Button>
				{/if}
				{#if inv.status !== 'Draft'}
					<Button
						variant="outline"
						size="sm"
						class="gap-2"
						onclick={() => {
							paymentAmount = balance > 0 ? balance : 0;
							paymentDialogOpen = true;
						}}
						disabled={actionLoading || !canEditInvoice}
					>
						<BanknoteArrowDown class="size-4!" />
						Record Payment
					</Button>
				{/if}
				<Button
					variant="outline"
					size="sm"
					class="gap-2 text-destructive hover:text-destructive"
					onclick={handleCancelInvoice}
					disabled={actionLoading || !canEditInvoice}
				>
					<XCircle class="size-4!" />
					Cancel
				</Button>
			</div>
		{/if}
	</div>

	<div class="flex flex-col gap-6 xl:flex-row xl:items-start">
		<!-- Left: Invoice Preview -->
		<div class="min-w-0 flex-1">
			<Card.Root class="overflow-hidden">
				<Card.Content class="p-6 sm:p-8">
					<!-- Company Header -->
					{#if company}
						<div class="mb-6 border-b pb-4 text-center">
							<h2 class="text-xl font-bold">{company.company_name || 'Your Company Name'}</h2>
							<p class="text-sm text-muted-foreground">
								{company.registered_address || 'Registered Address'}
							</p>
							{#if company.tin}
								<p class="text-sm text-muted-foreground">TIN: {company.tin}</p>
							{/if}
							{#if company.contact_info}
								<p class="text-sm text-muted-foreground">{company.contact_info}</p>
							{/if}
						</div>
					{/if}

					<div class="mb-6 flex items-start justify-between">
						<div>
							<p class="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
								SALES INVOICE
							</p>
							<p class="font-mono text-2xl font-bold">{inv.invoice_number}</p>
						</div>
						<div class="text-right text-sm">
							<p><span class="text-muted-foreground">Date:</span> {formatDate(inv.issue_date)}</p>
							{#if inv.due_date}
								<p><span class="text-muted-foreground">Due:</span> {formatDate(inv.due_date)}</p>
							{/if}
						</div>
					</div>

					<!-- Sold To -->
					<div class="mb-6 rounded-md bg-muted/50 p-4">
						<p class="mb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
							SOLD TO
						</p>
						<p class="font-medium">{getClientName()}</p>
						{#if inv.client_profiles?.registered_address}
							<p class="text-sm text-muted-foreground">{inv.client_profiles.registered_address}</p>
						{/if}
						{#if inv.client_profiles?.tin}
							<p class="text-sm text-muted-foreground">TIN: {inv.client_profiles.tin}</p>
						{/if}
						{#if inv.client_profiles?.business_style}
							<p class="text-sm text-muted-foreground">
								Business Style: {inv.client_profiles.business_style}
							</p>
						{/if}
					</div>

					<!-- Application -->
					{#if inv.ip_applications}
						<div class="mb-6 text-sm">
							<span class="text-muted-foreground">Application:</span>
							<span class="font-medium">{inv.ip_applications.title_of_invention}</span>
							{#if inv.ip_applications.application_number}
								<span class="text-muted-foreground">({inv.ip_applications.application_number})</span
								>
							{/if}
						</div>
					{/if}

					<!-- Line Items Table -->
					<div class="mb-6 overflow-x-auto">
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b bg-muted/30">
									<th class="px-3 py-2 text-left font-medium">Description</th>
									<th class="w-16 px-3 py-2 text-center font-medium">Qty</th>
									<th class="w-28 px-3 py-2 text-right font-medium">Unit Cost</th>
									<th class="w-28 px-3 py-2 text-right font-medium">Amount</th>
								</tr>
							</thead>
							<tbody>
								{#each lineItems as item (item.line_item_id)}
									<tr class="border-b">
										<td class="px-3 py-2">
											{item.description}
											<Badge variant="outline" class="ml-2 text-[10px]">
												{item.is_vatable ? 'VAT' : 'Exempt'}
											</Badge>
										</td>
										<td class="px-3 py-2 text-center">{item.quantity}</td>
										<td class="px-3 py-2 text-right">{formatCurrency(item.unit_cost)}</td>
										<td class="px-3 py-2 text-right font-medium"
											>{formatCurrency(item.total_amount)}</td
										>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>

					<!-- VAT Summary -->
					<div class="flex justify-end">
						<div class="w-72 space-y-2 text-sm">
							<div class="flex justify-between">
								<span class="text-muted-foreground">Vatable Sales</span>
								<span>{formatCurrency(inv.vatable_sales)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">VAT Amount (12%)</span>
								<span>{formatCurrency(inv.vat_amount)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">VAT-Exempt Sales</span>
								<span>{formatCurrency(inv.vat_exempt_sales)}</span>
							</div>
							<div class="flex justify-between">
								<span class="text-muted-foreground">Zero-Rated Sales</span>
								<span>{formatCurrency(inv.zero_rated_sales)}</span>
							</div>
							<Separator />
							<div class="flex justify-between text-base font-bold">
								<span>Total</span>
								<span>{formatCurrency(inv.total_amount)}</span>
							</div>
						</div>
					</div>

					<!-- BIR Footer -->
					{#if company?.atp_number || company?.printer_name}
						<div class="mt-8 border-t pt-4 text-xs text-muted-foreground">
							{#if company.printer_name}
								<p>
									Printer: {company.printer_name}
									{company.printer_tin ? `(TIN: ${company.printer_tin})` : ''}
								</p>
							{/if}
							{#if company.atp_number}
								<p>
									ATP No.: {company.atp_number}
									{company.atp_date_issued
										? `(Issued: ${formatDate(company.atp_date_issued)})`
										: ''}
								</p>
							{/if}
						</div>
					{/if}

					{#if inv.notes}
						<div class="mt-6 rounded-md bg-muted/30 p-3 text-sm">
							<p class="mb-1 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
								Notes
							</p>
							<p class="text-muted-foreground">{inv.notes}</p>
						</div>
					{/if}
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right: Payment Summary & History -->
		<div class="w-full shrink-0 xl:w-80">
			<div class="sticky top-6 space-y-4">
				<!-- Payment Summary -->
				<Card.Root>
					<Card.Header>
						<Card.Title
							class="text-sm font-semibold tracking-widest text-muted-foreground uppercase"
						>
							Payment Summary
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Total</span>
							<span class="font-medium">{formatCurrency(inv.total_amount)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Paid</span>
							<span class="text-emerald-600 dark:text-emerald-400"
								>{formatCurrency(inv.amount_paid)}</span
							>
						</div>
						{#if Number(inv.ewt_amount) > 0}
							<div class="flex justify-between text-sm">
								<span class="text-muted-foreground">EWT Deducted</span>
								<span class="text-amber-600 dark:text-amber-400"
									>{formatCurrency(inv.ewt_amount)}</span
								>
							</div>
						{/if}
						<Separator />
						<div class="flex justify-between font-bold">
							<span>Balance</span>
							<span
								class={balance > 0 ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}
							>
								{formatCurrency(balance)}
							</span>
						</div>

						<!-- Progress bar -->
						{@const payProgress =
							Number(inv.total_amount) > 0
								? Math.min(
										((Number(inv.amount_paid) + Number(inv.ewt_amount)) /
											Number(inv.total_amount)) *
											100,
										100
									)
								: 0}
						<div class="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								class="h-full rounded-full bg-emerald-500 transition-all duration-500"
								style="width: {payProgress}%"
							></div>
						</div>
						<p class="text-center text-xs text-muted-foreground">
							{payProgress.toFixed(0)}% collected
						</p>
					</Card.Content>
				</Card.Root>

				<!-- Payment History -->
				{#if payments.length > 0}
					<Card.Root>
						<Card.Header>
							<Card.Title
								class="text-sm font-semibold tracking-widest text-muted-foreground uppercase"
							>
								Payment History
							</Card.Title>
						</Card.Header>
						<Card.Content class="space-y-3">
							{#each payments as payment (payment.payment_id)}
								<div class="space-y-1 rounded-md border p-3">
									<div class="flex items-center justify-between">
										<span class="font-mono text-xs font-medium">{payment.receipt_number}</span>
										<Badge variant="outline" class="text-xs">{payment.payment_method}</Badge>
									</div>
									<div class="flex items-center justify-between text-sm">
										<span class="text-muted-foreground">{formatDate(payment.payment_date)}</span>
										<span class="font-medium text-emerald-600 dark:text-emerald-400">
											{formatCurrency(payment.amount)}
										</span>
									</div>
									{#if Number(payment.ewt_amount) > 0}
										<p class="text-xs text-amber-600 dark:text-amber-400">
											EWT: {formatCurrency(payment.ewt_amount)} ({(
												Number(payment.ewt_rate ?? 0) * 100
											).toFixed(0)}%)
										</p>
									{/if}
									{#if payment.user_profiles}
										<p class="text-xs text-muted-foreground">
											Recorded by {[
												payment.user_profiles.first_name,
												payment.user_profiles.last_name
											]
												.filter(Boolean)
												.join(' ')}
										</p>
									{/if}
									{#if payment.notes}
										<p class="text-xs text-muted-foreground italic">{payment.notes}</p>
									{/if}
								</div>
							{/each}
						</Card.Content>
					</Card.Root>
				{/if}
			</div>
		</div>
	</div>
</div>

<!-- Record Payment Dialog -->
<Dialog.Root bind:open={paymentDialogOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Record Payment</Dialog.Title>
			<Dialog.Description>
				Record a payment against invoice {inv.invoice_number}. Balance: {formatCurrency(balance)}
			</Dialog.Description>
		</Dialog.Header>
		<div class="space-y-4 py-4">
			<div>
				<label for="payment-amount" class="mb-1 block text-sm font-medium">Amount (₱)</label>
				<Input id="payment-amount" type="number" min="0" step="0.01" bind:value={paymentAmount} />
			</div>

			<div>
				<label for="payment-date" class="mb-1 block text-sm font-medium">Payment Date</label>
				<Input id="payment-date" type="date" bind:value={paymentDate} />
			</div>

			<div>
				<label for="payment-method" class="mb-1 block text-sm font-medium">Payment Method</label>
				<select
					id="payment-method"
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					bind:value={paymentMethod}
				>
					{#each PAYMENT_METHODS as method (method)}
						<option value={method}>{method}</option>
					{/each}
				</select>
			</div>

			<div>
				<label for="ewt-rate" class="mb-1 block text-sm font-medium">Withholding Tax (EWT)</label>
				<select
					id="ewt-rate"
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					bind:value={paymentEwtRate}
				>
					{#each EWT_RATES as rate (rate.value)}
						<option value={rate.value}>{rate.label}</option>
					{/each}
				</select>
				{#if computedEwt > 0}
					<p class="mt-1 text-xs text-amber-600 dark:text-amber-400">
						EWT Amount: {formatCurrency(computedEwt)}
					</p>
				{/if}
			</div>

			<div>
				<label for="payment-notes" class="mb-1 block text-sm font-medium">Notes (Optional)</label>
				<textarea
					id="payment-notes"
					class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
					rows="2"
					bind:value={paymentNotes}
				></textarea>
			</div>
		</div>
		<Dialog.Footer>
			<Button variant="outline" onclick={() => (paymentDialogOpen = false)}>Cancel</Button>
			<Button onclick={handleRecordPayment} disabled={actionLoading}>
				{actionLoading ? 'Recording…' : 'Record Payment'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
