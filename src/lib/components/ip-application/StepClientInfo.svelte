<script lang="ts">
	import { Input } from '$lib/shadcn/components/ui/input';
	import { Label } from '$lib/shadcn/components/ui/label';
	import PhoneInput from '$lib/components/ip-application/PhoneInput.svelte';
	import type { IpApplicationFormData } from '$lib/types/ip-application';

	let { formData = $bindable() }: { formData: IpApplicationFormData } = $props();
</script>

<div class="space-y-6">
	<div class="grid gap-6 md:grid-cols-2">
		<!-- First Name -->
		<div class="space-y-2">
			<Label for="client-first-name">First Name <span class="text-destructive">*</span></Label>
			<Input
				id="client-first-name"
				placeholder="e.g. Juan"
				bind:value={formData.clientFirstName}
				required
			/>
		</div>

		<!-- Middle Name -->
		<div class="space-y-2">
			<Label for="client-middle-name">Middle Name</Label>
			<Input
				id="client-middle-name"
				placeholder="e.g. Santos"
				bind:value={formData.clientMiddleName}
			/>
		</div>

		<!-- Last Name -->
		<div class="space-y-2">
			<Label for="client-last-name">Last Name <span class="text-destructive">*</span></Label>
			<Input
				id="client-last-name"
				placeholder="e.g. Dela Cruz"
				bind:value={formData.clientLastName}
				required
			/>
		</div>

		<!-- Email -->
		<div class="space-y-2">
			<Label for="client-email">Email Address <span class="text-destructive">*</span></Label>
			<Input
				id="client-email"
				type="email"
				placeholder="email@example.com"
				bind:value={formData.clientEmail}
				required
			/>
		</div>

		<!-- Mobile Number -->
		<div class="space-y-2 md:col-span-2">
			<Label for="client-mobile">Mobile Number</Label>
			<PhoneInput
				bind:value={formData.clientMobileNumber}
				bind:dialCode={formData.clientDialCode}
			/>
		</div>

		<!-- Nationality -->
		<div class="space-y-2">
			<Label for="client-nationality">Nationality</Label>
			<Input
				id="client-nationality"
				placeholder="e.g. Filipino"
				bind:value={formData.clientNationality}
			/>
		</div>

		<!-- Company -->
		<div class="space-y-2">
			<Label for="client-company">Company / Organization</Label>
			<Input id="client-company" placeholder="Company name" bind:value={formData.clientCompany} />
		</div>

		<!-- Company Address -->
		<div class="space-y-2 md:col-span-2">
			<Label for="client-company-address">Company Address</Label>
			<Input
				id="client-company-address"
				placeholder="e.g. 123 Main St, Manila"
				bind:value={formData.clientCompanyAddress}
			/>
		</div>
	</div>
</div>
