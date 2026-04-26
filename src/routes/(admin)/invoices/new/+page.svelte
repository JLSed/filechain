<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { ArrowLeft, Plus, Trash2, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index';
	import { computeVatBreakdown } from '$lib/types/InvoiceTypes';

	let { data }: PageProps = $props();
	let submitting = $state(false);

	// Form state
	let selectedClientId = $state('');
	let selectedApplicationId = $state('');
	let issueDate = $state(new Date().toISOString().split('T')[0]);
	let dueDate = $state('');
	let notes = $state('');

	interface LineItem {
		description: string;
		quantity: number;
		unit_cost: number;
		line_type: 'professional_fee' | 'disbursement';
		is_vatable: boolean;
	}

	let lineItems = $state<LineItem[]>([
		{ description: '', quantity: 1, unit_cost: 0, line_type: 'professional_fee', is_vatable: true }
	]);

	// Derived: client filtered applications
	const clientApplications = $derived(
		selectedClientId ? data.applications.filter((app) => app.client_id === selectedClientId) : []
	);

	// Derived: selected client info
	const selectedClient = $derived(data.clients.find((c) => c.client_id === selectedClientId));

	// Derived: client TIN warning
	const showTinWarning = $derived(selectedClient && !selectedClient.tin);

	// Derived: VAT breakdown
	const vatBreakdown = $derived(computeVatBreakdown(lineItems));

	function getClientDisplayName(client: (typeof data.clients)[0]): string {
		if (client.is_individual) {
			return [client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ');
		}
		return client.company_name || [client.first_name, client.last_name].filter(Boolean).join(' ');
	}

	function addLineItem() {
		lineItems = [
			...lineItems,
			{
				description: '',
				quantity: 1,
				unit_cost: 0,
				line_type: 'professional_fee',
				is_vatable: true
			}
		];
	}

	function removeLineItem(idx: number) {
		lineItems = lineItems.filter((_, i) => i !== idx);
	}

	function handleLineTypeChange(idx: number, newType: 'professional_fee' | 'disbursement') {
		lineItems[idx].line_type = newType;
		lineItems[idx].is_vatable = newType === 'professional_fee';
	}

	function formatCurrency(val: number): string {
		return `₱${val.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	async function handleSubmit() {
		// Validate
		if (!selectedClientId) {
			toast.error('Please select a client.');
			return;
		}
		if (!selectedApplicationId) {
			toast.error('Please select an application.');
			return;
		}
		if (lineItems.length === 0) {
			toast.error('Add at least one line item.');
			return;
		}
		const emptyDescriptions = lineItems.some((li) => !li.description.trim());
		if (emptyDescriptions) {
			toast.error('All line items must have a description.');
			return;
		}

		submitting = true;
		try {
			const payload = {
				client_id: selectedClientId,
				application_id: selectedApplicationId,
				issue_date: issueDate,
				due_date: dueDate || undefined,
				notes,
				line_items: lineItems
			};

			const formData = new FormData();
			formData.set('payload', JSON.stringify(payload));

			const response = await fetch('?/createInvoice', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const message =
					(result.data as { message?: string })?.message ?? 'Failed to create invoice.';
				toast.error(message);
				return;
			}

			if (result.type === 'error') {
				toast.error(result.error?.message ?? 'An unexpected error occurred.');
				return;
			}

			toast.success('Invoice created successfully.');
			if (result.type === 'success') {
				const invoiceId = (result.data as { invoiceId?: string } | undefined)?.invoiceId;
				if (invoiceId) {
					goto(`/invoices/${invoiceId}`);
				} else {
					goto('/invoices');
				}
			} else {
				goto('/invoices');
			}
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
		} finally {
			submitting = false;
		}
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button variant="outline" size="icon" onclick={() => history.back()}>
			<ArrowLeft class="size-4" />
		</Button>
		<div>
			<h1 class="text-lg font-semibold">New Invoice</h1>
			<p class="text-sm text-muted-foreground">Create a BIR-compliant invoice</p>
		</div>
	</div>

	<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
		<!-- Left: Form -->
		<div class="min-w-0 flex-1 space-y-6">
			<!-- Client & Application -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
						Client & Application
					</Card.Title>
				</Card.Header>
				<Card.Content class="space-y-4">
					<div>
						<label for="client-select" class="mb-1 block text-xs text-muted-foreground"
							>Client</label
						>
						<select
							id="client-select"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							bind:value={selectedClientId}
							onchange={() => {
								selectedApplicationId = '';
							}}
						>
							<option value="">Select client…</option>
							{#each data.clients as client (client.client_id)}
								<option value={client.client_id}>
									{getClientDisplayName(client)}
									{client.tin ? ` (TIN: ${client.tin})` : ''}
								</option>
							{/each}
						</select>
					</div>

					{#if showTinWarning}
						<div
							class="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
						>
							<AlertTriangle class="mt-0.5 size-4 shrink-0" />
							<p>
								This client has no TIN on file. BIR requires TIN for invoices ≥ ₱500. You can add it
								from the <a href="/client/{selectedClientId}" class="font-medium underline"
									>client profile</a
								>.
							</p>
						</div>
					{/if}

					<div>
						<label for="app-select" class="mb-1 block text-xs text-muted-foreground"
							>Application</label
						>
						<select
							id="app-select"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							bind:value={selectedApplicationId}
							disabled={!selectedClientId}
						>
							<option value=""
								>{selectedClientId ? 'Select application…' : 'Select a client first'}</option
							>
							{#each clientApplications as app (app.application_id)}
								<option value={app.application_id}>
									{app.title_of_invention}
									{app.application_number ? ` (${app.application_number})` : ''}
								</option>
							{/each}
						</select>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div>
							<label for="issue-date" class="mb-1 block text-xs text-muted-foreground"
								>Issue Date</label
							>
							<Input id="issue-date" type="date" bind:value={issueDate} />
						</div>
						<div>
							<label for="due-date" class="mb-1 block text-xs text-muted-foreground"
								>Due Date (Optional)</label
							>
							<Input id="due-date" type="date" bind:value={dueDate} />
						</div>
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Line Items -->
			<Card.Root>
				<Card.Header class="flex flex-row items-center justify-between">
					<Card.Title class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
						Line Items
					</Card.Title>
					<Button variant="outline" size="sm" class="gap-1" onclick={addLineItem}>
						<Plus class="size-3!" />
						Add Item
					</Button>
				</Card.Header>
				<Card.Content>
					<div class="space-y-3">
						{#each lineItems as item, idx (idx)}
							<div class="space-y-3 rounded-md border p-3">
								<div class="flex items-start gap-2">
									<div class="flex-1">
										<label for="line-desc-{idx}" class="mb-1 block text-xs text-muted-foreground"
											>Description</label
										>
										<Input
											id="line-desc-{idx}"
											placeholder="e.g., Professional Fee: Patent Drafting"
											bind:value={item.description}
										/>
									</div>
									{#if lineItems.length > 1}
										<Button
											variant="ghost"
											size="icon"
											class="mt-5 text-destructive hover:text-destructive"
											onclick={() => removeLineItem(idx)}
										>
											<Trash2 class="size-4" />
										</Button>
									{/if}
								</div>

								<div class="grid grid-cols-3 gap-3">
									<div>
										<label for="line-type-{idx}" class="mb-1 block text-xs text-muted-foreground"
											>Type</label
										>
										<select
											id="line-type-{idx}"
											class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
											value={item.line_type}
											onchange={(e) =>
												handleLineTypeChange(
													idx,
													(e.target as HTMLSelectElement).value as
														| 'professional_fee'
														| 'disbursement'
												)}
										>
											<option value="professional_fee">Professional Fee (VAT 12%)</option>
											<option value="disbursement">Disbursement (VAT-Exempt)</option>
										</select>
									</div>
									<div>
										<label for="line-qty-{idx}" class="mb-1 block text-xs text-muted-foreground"
											>Quantity</label
										>
										<Input id="line-qty-{idx}" type="number" min="1" bind:value={item.quantity} />
									</div>
									<div>
										<label for="line-cost-{idx}" class="mb-1 block text-xs text-muted-foreground"
											>Unit Cost (₱)</label
										>
										<Input
											id="line-cost-{idx}"
											type="number"
											min="0"
											step="0.01"
											bind:value={item.unit_cost}
										/>
									</div>
								</div>

								<div class="flex items-center justify-between text-sm">
									<Badge variant="outline" class="text-xs">
										{item.is_vatable ? 'Vatable (12%)' : 'VAT-Exempt'}
									</Badge>
									<span class="font-medium">
										Line Total: {formatCurrency(item.quantity * item.unit_cost)}
									</span>
								</div>
							</div>
						{/each}
					</div>
				</Card.Content>
			</Card.Root>

			<!-- Notes -->
			<Card.Root>
				<Card.Header>
					<Card.Title class="text-sm font-semibold tracking-widest text-muted-foreground uppercase">
						Notes
					</Card.Title>
				</Card.Header>
				<Card.Content>
					<textarea
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						rows="3"
						placeholder="Additional notes or terms..."
						bind:value={notes}
					></textarea>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Right: VAT Breakdown + Submit -->
		<div class="w-full shrink-0 lg:w-80">
			<div class="sticky top-6 space-y-4">
				<Card.Root>
					<Card.Header>
						<Card.Title
							class="text-sm font-semibold tracking-widest text-muted-foreground uppercase"
						>
							VAT Breakdown
						</Card.Title>
					</Card.Header>
					<Card.Content class="space-y-3">
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Vatable Sales</span>
							<span>{formatCurrency(vatBreakdown.vatableSales)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">VAT Amount (12%)</span>
							<span>{formatCurrency(vatBreakdown.vatAmount)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">VAT-Exempt Sales</span>
							<span>{formatCurrency(vatBreakdown.vatExemptSales)}</span>
						</div>
						<div class="flex justify-between text-sm">
							<span class="text-muted-foreground">Zero-Rated Sales</span>
							<span>{formatCurrency(vatBreakdown.zeroRatedSales)}</span>
						</div>
						<Separator />
						<div class="flex justify-between text-base font-bold">
							<span>Total Amount</span>
							<span>{formatCurrency(vatBreakdown.totalAmount)}</span>
						</div>
					</Card.Content>
				</Card.Root>

				<Button class="w-full" onclick={handleSubmit} disabled={submitting}>
					{submitting ? 'Creating…' : 'Create Invoice (Draft)'}
				</Button>

				<p class="text-center text-xs text-muted-foreground">
					Invoice will be saved as Draft. You can review and send it later.
				</p>
			</div>
		</div>
	</div>
</div>
