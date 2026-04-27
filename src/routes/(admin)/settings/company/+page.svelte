<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Building2, Printer, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index';

	let { data }: PageProps = $props();
	let saving = $state(false);
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div>
		<h1 class="text-lg font-semibold">Company / BIR Settings</h1>
		<p class="text-sm text-muted-foreground">
			Configure company information displayed on BIR-compliant invoices
		</p>
	</div>

	{#if data.loadError}
		<div
			class="flex items-start gap-2 rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-700 dark:bg-red-950/30 dark:text-red-400"
		>
			<AlertTriangle class="mt-0.5 size-4 shrink-0" />
			<p>Failed to load company settings: {data.loadError}</p>
		</div>
	{/if}

	<form
		method="POST"
		action="?/updateSettings"
		use:enhance={() => {
			saving = true;
			return async ({ result, update }) => {
				saving = false;
				if (result.type === 'success') {
					toast.success('Company settings updated successfully.');
					await update();
				} else if (result.type === 'failure') {
					const message = (result.data as { message?: string })?.message ?? 'Failed to save.';
					toast.error(message);
				}
			};
		}}
		class="max-w-2xl space-y-6"
	>
		<!-- Company Info -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center gap-2">
				<Building2 class="size-5 text-muted-foreground" />
				<div>
					<Card.Title>Company Information</Card.Title>
					<Card.Description>Basic business registration details</Card.Description>
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div>
					<label for="company_name" class="mb-1 block text-sm font-medium">Company Name</label>
					<Input
						id="company_name"
						name="company_name"
						value={data.companySettings.company_name}
						placeholder="e.g., ABC IP Consultancy Inc."
					/>
				</div>

				<div>
					<label for="registered_address" class="mb-1 block text-sm font-medium"
						>Registered Address</label
					>
					<textarea
						id="registered_address"
						name="registered_address"
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						rows="2"
						placeholder="Official BIR-registered address"
						>{data.companySettings.registered_address}</textarea
					>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="tin" class="mb-1 block text-sm font-medium">TIN</label>
						<Input
							id="tin"
							name="tin"
							value={data.companySettings.tin}
							placeholder="000-000-000-000"
						/>
					</div>
					<div>
						<label for="vat_status" class="mb-1 block text-sm font-medium">VAT Status</label>
						<select
							id="vat_status"
							name="vat_status"
							class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
							value={data.companySettings.vat_status}
						>
							<option value="VAT">VAT Registered</option>
							<option value="NON-VAT">Non-VAT</option>
						</select>
					</div>
				</div>

				<div>
					<label for="contact_info" class="mb-1 block text-sm font-medium">Contact Info</label>
					<Input
						id="contact_info"
						name="contact_info"
						value={data.companySettings.contact_info}
						placeholder="Phone / Email"
					/>
				</div>
			</Card.Content>
		</Card.Root>

		<!-- BIR Printer & ATP -->
		<Card.Root>
			<Card.Header class="flex flex-row items-center gap-2">
				<Printer class="size-5 text-muted-foreground" />
				<div>
					<Card.Title>BIR Printer & ATP Details</Card.Title>
					<Card.Description>Required for official BIR-compliant invoice footers</Card.Description>
				</div>
			</Card.Header>
			<Card.Content class="space-y-4">
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="printer_name" class="mb-1 block text-sm font-medium">Printer Name</label>
						<Input
							id="printer_name"
							name="printer_name"
							value={data.companySettings.printer_name ?? ''}
							placeholder="BIR-accredited printer"
						/>
					</div>
					<div>
						<label for="printer_tin" class="mb-1 block text-sm font-medium">Printer TIN</label>
						<Input
							id="printer_tin"
							name="printer_tin"
							value={data.companySettings.printer_tin ?? ''}
							placeholder="000-000-000-000"
						/>
					</div>
				</div>

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="atp_number" class="mb-1 block text-sm font-medium">ATP Number</label>
						<Input
							id="atp_number"
							name="atp_number"
							value={data.companySettings.atp_number ?? ''}
							placeholder="Authority to Print No."
						/>
					</div>
					<div>
						<label for="atp_date_issued" class="mb-1 block text-sm font-medium"
							>ATP Date Issued</label
						>
						<Input
							id="atp_date_issued"
							name="atp_date_issued"
							type="date"
							value={data.companySettings.atp_date_issued ?? ''}
						/>
					</div>
				</div>
			</Card.Content>
		</Card.Root>

		<div class="flex justify-end">
			<Button type="submit" disabled={saving}>
				{saving ? 'Saving…' : 'Save Settings'}
			</Button>
		</div>
	</form>
</div>
