<script lang="ts">
	import type { Infer, ValidationErrors } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';

	let {
		form,
		errors
	}: {
		form: Infer<typeof IpApplicationFormSchema>;
		errors: ValidationErrors<Infer<typeof IpApplicationFormSchema>>;
	} = $props();
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Client Information</h2>
		<p class="text-sm text-muted-foreground">Enter the client's personal and company details.</p>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		<div class="space-y-1.5">
			<label for="first_name" class="text-sm font-medium text-foreground">First Name</label>
			<Input
				id="first_name"
				bind:value={form.client_profiles.first_name}
				placeholder="First Name"
				aria-invalid={errors.client_profiles?.first_name ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.first_name}
				<p class="text-xs text-destructive">{errors.client_profiles.first_name}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="middle_name" class="text-sm font-medium text-foreground">Middle Name</label>
			<Input
				id="middle_name"
				bind:value={form.client_profiles.middle_name}
				placeholder="Middle Name"
				aria-invalid={errors.client_profiles?.middle_name ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.middle_name}
				<p class="text-xs text-destructive">{errors.client_profiles.middle_name}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="last_name" class="text-sm font-medium text-foreground">Last Name</label>
			<Input
				id="last_name"
				bind:value={form.client_profiles.last_name}
				placeholder="Last Name"
				aria-invalid={errors.client_profiles?.last_name ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.last_name}
				<p class="text-xs text-destructive">{errors.client_profiles.last_name}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="email" class="text-sm font-medium text-foreground">Email</label>
			<Input
				id="email"
				type="email"
				bind:value={form.client_profiles.email}
				placeholder="client@example.com"
				aria-invalid={errors.client_profiles?.email ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.email}
				<p class="text-xs text-destructive">{errors.client_profiles.email}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="mobile_number" class="text-sm font-medium text-foreground">Mobile Number</label>
			<Input
				id="mobile_number"
				bind:value={form.client_profiles.mobile_number}
				placeholder="+63 900 000 0000"
				aria-invalid={errors.client_profiles?.mobile_number ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.mobile_number}
				<p class="text-xs text-destructive">{errors.client_profiles.mobile_number}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="nationality" class="text-sm font-medium text-foreground">Nationality</label>
			<Input
				id="nationality"
				bind:value={form.client_profiles.nationality}
				placeholder="Nationality"
				aria-invalid={errors.client_profiles?.nationality ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.nationality}
				<p class="text-xs text-destructive">{errors.client_profiles.nationality}</p>
			{/if}
		</div>

		<div class="space-y-1.5 md:col-span-2 lg:col-span-3">
			<label for="company_name" class="text-sm font-medium text-foreground">Company Name</label>
			<Input
				id="company_name"
				bind:value={form.client_profiles.company_name}
				placeholder="Company Name"
				aria-invalid={errors.client_profiles?.company_name ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.company_name}
				<p class="text-xs text-destructive">{errors.client_profiles.company_name}</p>
			{/if}
		</div>

		<div class="space-y-1.5 md:col-span-2 lg:col-span-3">
			<label for="company_address" class="text-sm font-medium text-foreground"
				>Company Address</label
			>
			<Input
				id="company_address"
				bind:value={form.client_profiles.company_address}
				placeholder="Company Address"
				aria-invalid={errors.client_profiles?.company_address ? 'true' : undefined}
			/>
			{#if errors.client_profiles?.company_address}
				<p class="text-xs text-destructive">{errors.client_profiles.company_address}</p>
			{/if}
		</div>
	</div>
</div>
