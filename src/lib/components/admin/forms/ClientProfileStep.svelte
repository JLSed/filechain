<script lang="ts">
	import type { Infer, ValidationErrors } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type { Writable } from 'svelte/store';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import PhoneInput from '$lib/components/global/PhoneInput.svelte';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import { UserPlus, Users, ArrowLeft, Search } from '@lucide/svelte';

	interface ClientProfileRow {
		client_id: string;
		first_name: string;
		last_name: string;
		middle_name: string | null;
		email: string;
		mobile_number: string | null;
		nationality: string;
		company_name: string | null;
		company_address: string | null;
	}

	type ClientMode = 'select' | 'new' | 'existing';

	let {
		form,
		errors,
		clientProfiles = [],
		onClientSelected
	}: {
		form: Writable<Infer<typeof IpApplicationFormSchema>>;
		errors: Writable<ValidationErrors<Infer<typeof IpApplicationFormSchema>>>;
		clientProfiles: ClientProfileRow[];
		onClientSelected: () => void;
	} = $props();

	let mode: ClientMode = $state('select');
	let searchQuery = $state('');

	// Phone input state
	let phoneDialCode = $state('+63');
	let phoneLocalNumber = $state('');

	// Sync combined value back to form
	$effect(() => {
		if (phoneLocalNumber) {
			$form.client_profiles.mobile_number = `${phoneDialCode} ${phoneLocalNumber}`;
		} else {
			$form.client_profiles.mobile_number = '';
		}
	});

	const filteredClients = $derived(() => {
		if (!searchQuery.trim()) return clientProfiles;
		const q = searchQuery.toLowerCase().trim();
		return clientProfiles.filter((c) => {
			const fullName = `${c.first_name} ${c.middle_name ?? ''} ${c.last_name}`.toLowerCase();
			const email = (c.email ?? '').toLowerCase();
			const company = (c.company_name ?? '').toLowerCase();
			return fullName.includes(q) || email.includes(q) || company.includes(q);
		});
	});

	function selectClient(client: ClientProfileRow) {
		$form.client_profiles = {
			client_id: client.client_id,
			first_name: client.first_name,
			middle_name: client.middle_name ?? '',
			last_name: client.last_name,
			email: client.email,
			mobile_number: client.mobile_number ?? '',
			nationality: client.nationality,
			company_name: client.company_name ?? '',
			company_address: client.company_address ?? ''
		};
		onClientSelected();
	}

	function resetToSelector() {
		mode = 'select';
		searchQuery = '';
	}
</script>

{#if mode === 'select'}
	<!-- ─── Mode Selector ─── -->
	<div class="flex h-full flex-col items-center justify-center">
		<div class="w-full max-w-lg space-y-4">
			<div class="mb-6 text-center">
				<h2 class="text-xl font-semibold text-foreground">Client Information</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					How would you like to provide the client details?
				</p>
			</div>

			<!-- New Client button -->
			<button
				type="button"
				class="group relative flex w-full cursor-pointer items-center gap-5 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
				onclick={() => {
					$form.client_profiles.client_id = undefined;
					mode = 'new';
				}}
			>
				<div
					class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"
				>
					<UserPlus class="size-6" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-foreground">New Client</p>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Enter client details manually for a new record
					</p>
				</div>
				<div
					class="text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
				>
					→
				</div>
			</button>

			<!-- Existing Client button -->
			<button
				type="button"
				class="group relative flex w-full cursor-pointer items-center gap-5 rounded-xl border border-border bg-card p-6 text-left transition-all duration-200 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5"
				onclick={() => (mode = 'existing')}
			>
				<div
					class="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20"
				>
					<Users class="size-6" />
				</div>
				<div class="min-w-0 flex-1">
					<p class="text-base font-semibold text-foreground">Existing Client</p>
					<p class="mt-0.5 text-sm text-muted-foreground">
						Select from previously registered clients
					</p>
				</div>
				<div
					class="text-muted-foreground/40 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary"
				>
					→
				</div>
			</button>
		</div>
	</div>
{:else if mode === 'new'}
	<!-- ─── New Client Form ─── -->
	<div class="space-y-6">
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				onclick={resetToSelector}
			>
				<ArrowLeft class="size-4" />
				Back
			</button>
			<div class="h-4 w-px bg-border"></div>
			<div>
				<h2 class="text-lg font-semibold text-foreground">New Client</h2>
				<p class="text-sm text-muted-foreground">
					Enter the client's personal and company details.
				</p>
			</div>
		</div>

		<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
			<div class="space-y-1.5">
				<label for="first_name" class="text-sm font-medium text-foreground">
					First Name <span class="text-destructive">*</span>
				</label>
				<Input
					id="first_name"
					bind:value={$form.client_profiles.first_name}
					placeholder="First Name"
					required
					aria-invalid={$errors.client_profiles?.first_name ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.first_name}
					<p class="text-xs text-destructive">{$errors.client_profiles.first_name}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="middle_name" class="text-sm font-medium text-foreground"> Middle Name </label>
				<Input
					id="middle_name"
					bind:value={$form.client_profiles.middle_name}
					placeholder="Middle Name"
					aria-invalid={$errors.client_profiles?.middle_name ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.middle_name}
					<p class="text-xs text-destructive">{$errors.client_profiles.middle_name}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="last_name" class="text-sm font-medium text-foreground">
					Last Name <span class="text-destructive">*</span>
				</label>
				<Input
					id="last_name"
					bind:value={$form.client_profiles.last_name}
					placeholder="Last Name"
					required
					aria-invalid={$errors.client_profiles?.last_name ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.last_name}
					<p class="text-xs text-destructive">{$errors.client_profiles.last_name}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="email" class="text-sm font-medium text-foreground">
					Email <span class="text-destructive">*</span>
				</label>
				<Input
					id="email"
					type="email"
					bind:value={$form.client_profiles.email}
					placeholder="client@example.com"
					required
					aria-invalid={$errors.client_profiles?.email ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.email}
					<p class="text-xs text-destructive">{$errors.client_profiles.email}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="mobile_number" class="text-sm font-medium text-foreground">
					Mobile Number <span class="text-destructive">*</span>
				</label>
				<PhoneInput bind:value={phoneLocalNumber} bind:dialCode={phoneDialCode} required />
				{#if $errors.client_profiles?.mobile_number}
					<p class="text-xs text-destructive">{$errors.client_profiles.mobile_number}</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="nationality" class="text-sm font-medium text-foreground">
					Nationality <span class="text-destructive">*</span>
				</label>
				<Input
					id="nationality"
					bind:value={$form.client_profiles.nationality}
					placeholder="Nationality"
					required
					aria-invalid={$errors.client_profiles?.nationality ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.nationality}
					<p class="text-xs text-destructive">{$errors.client_profiles.nationality}</p>
				{/if}
			</div>

			<div class="space-y-1.5 md:col-span-2 lg:col-span-3">
				<label for="company_name" class="text-sm font-medium text-foreground"> Company Name </label>
				<Input
					id="company_name"
					bind:value={$form.client_profiles.company_name}
					placeholder="Company Name"
					aria-invalid={$errors.client_profiles?.company_name ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.company_name}
					<p class="text-xs text-destructive">{$errors.client_profiles.company_name}</p>
				{/if}
			</div>

			<div class="space-y-1.5 md:col-span-2 lg:col-span-3">
				<label for="company_address" class="text-sm font-medium text-foreground">
					Company Address
				</label>
				<Input
					id="company_address"
					bind:value={$form.client_profiles.company_address}
					placeholder="Company Address"
					aria-invalid={$errors.client_profiles?.company_address ? 'true' : undefined}
				/>
				{#if $errors.client_profiles?.company_address}
					<p class="text-xs text-destructive">{$errors.client_profiles.company_address}</p>
				{/if}
			</div>
		</div>
	</div>
{:else}
	<!-- ─── Existing Client Selection ─── -->
	<div class="flex h-full flex-col space-y-4">
		<div class="flex items-center gap-3">
			<button
				type="button"
				class="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
				onclick={resetToSelector}
			>
				<ArrowLeft class="size-4" />
				Back
			</button>
			<div class="h-4 w-px bg-border"></div>
			<div>
				<h2 class="text-lg font-semibold text-foreground">Select Existing Client</h2>
				<p class="text-sm text-muted-foreground">Search and select a client from the database.</p>
			</div>
		</div>

		<!-- Search bar -->
		<div class="relative max-w-md">
			<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
			<Input
				bind:value={searchQuery}
				type="search"
				placeholder="Search by name, email, or company..."
				class="pl-9"
			/>
		</div>

		<!-- Client table -->
		<div class="flex-1 overflow-auto rounded-lg border border-border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>Name</Table.Head>
						<Table.Head>Email</Table.Head>
						<Table.Head>Company</Table.Head>
						<Table.Head>Nationality</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#if filteredClients().length === 0}
						<Table.Row>
							<Table.Cell colspan={4} class="py-12 text-center text-muted-foreground">
								{searchQuery.trim()
									? 'No clients match your search.'
									: 'No clients found in the database.'}
							</Table.Cell>
						</Table.Row>
					{:else}
						{#each filteredClients() as client (client.client_id)}
							<Table.Row
								class="cursor-pointer transition-colors hover:bg-primary/5"
								onclick={() => selectClient(client)}
							>
								<Table.Cell class="font-medium">
									{client.first_name}
									{client.middle_name ? `${client.middle_name} ` : ''}
									{client.last_name}
								</Table.Cell>
								<Table.Cell>{client.email ?? '—'}</Table.Cell>
								<Table.Cell>{client.company_name ?? '—'}</Table.Cell>
								<Table.Cell>{client.nationality ?? '—'}</Table.Cell>
							</Table.Row>
						{/each}
					{/if}
				</Table.Body>
			</Table.Root>
		</div>
	</div>
{/if}
