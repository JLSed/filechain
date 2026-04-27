<script lang="ts">
	import type { Infer } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type { TypeOfInvention } from '$lib/types/DatabaseTypes';
	import { TEAM_ROLES } from '$lib/constants/SchemaData';

	let {
		form = $bindable(),
		inventionTypes
	}: {
		form: Infer<typeof IpApplicationFormSchema>;
		inventionTypes: TypeOfInvention[];
	} = $props();

	function getInventionTypeName(id: number): string {
		return inventionTypes.find((t) => t != null && t.id === id)?.name ?? '—';
	}

	const isIndividual = $derived(form.client_profiles.is_individual);
	const clientName = $derived(
		[
			form.client_profiles.first_name,
			form.client_profiles.middle_name,
			form.client_profiles.last_name
		]
			.map((value) => value?.trim())
			.filter(Boolean)
			.join(' ')
	);
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Review & Submit</h2>
		<p class="text-sm text-muted-foreground">Review the information below before submitting.</p>
	</div>

	<!-- Assign a Team -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Assign a Team</h3>
		<p class="text-sm text-muted-foreground">
			Select which team will be assigned to this application.
		</p>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			{#each TEAM_ROLES as team (team)}
				<button
					type="button"
					class="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium transition-all
						{form.application.team_assigned === team
						? 'border-primary bg-primary/10 text-primary ring-1 ring-primary'
						: 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'}"
					onclick={() => {
						form.application.team_assigned = team;
					}}
				>
					<span
						class="flex size-5 shrink-0 items-center justify-center rounded-full border-2
							{form.application.team_assigned === team
							? 'border-primary bg-primary'
							: 'border-muted-foreground/40'}"
					>
						{#if form.application.team_assigned === team}
							<span class="block size-2 rounded-full bg-primary-foreground"></span>
						{/if}
					</span>
					{team}
				</button>
			{/each}
		</div>
		{#if !form.application.team_assigned}
			<p class="text-xs text-destructive">Please select a team to assign.</p>
		{/if}
	</div>

	<!-- Client Information -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Client Information</h3>
		<div class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2 lg:grid-cols-3">
			<div>
				<span class="text-muted-foreground">Client Type:</span>
				<span class="ml-1 font-medium">
					{isIndividual ? 'Individual' : 'Company / Organization'}
				</span>
			</div>
			{#if isIndividual || clientName}
				<div>
					<span class="text-muted-foreground">{isIndividual ? 'Name' : 'Contact Person'}:</span>
					<span class="ml-1 font-medium">{clientName || '—'}</span>
				</div>
			{/if}
			<div>
				<span class="text-muted-foreground">Email:</span>
				<span class="ml-1 font-medium">{form.client_profiles.email || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Mobile:</span>
				<span class="ml-1 font-medium">{form.client_profiles.mobile_number || '—'}</span>
			</div>
			{#if isIndividual}
				<div>
					<span class="text-muted-foreground">Nationality:</span>
					<span class="ml-1 font-medium">{form.client_profiles.nationality || '—'}</span>
				</div>
			{/if}
			{#if !isIndividual}
				<div class="md:col-span-2">
					<span class="text-muted-foreground">Company Name:</span>
					<span class="ml-1 font-medium">{form.client_profiles.company_name || '—'}</span>
				</div>
				<div class="md:col-span-2 lg:col-span-3">
					<span class="text-muted-foreground">Company Address:</span>
					<span class="ml-1 font-medium">{form.client_profiles.company_address || '—'}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- Application Details -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Application Details</h3>
		<div class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2 lg:grid-cols-3">
			<div class="md:col-span-2 lg:col-span-3">
				<span class="text-muted-foreground">Title:</span>
				<span class="ml-1 font-medium">{form.application.title_of_invention || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Status:</span>
				<span class="ml-1 font-medium">Client Intake</span>
			</div>
			<div>
				<span class="text-muted-foreground">Type of Invention:</span>
				<span class="ml-1 font-medium"
					>{getInventionTypeName(form.application.type_of_invention_id)}</span
				>
			</div>
			{#if form.application.inventor_names.length > 0}
				<div class="md:col-span-2 lg:col-span-3">
					<span class="text-muted-foreground">Inventors:</span>
					<span class="ml-1 font-medium"
						>{form.application.inventor_names.filter(Boolean).join(', ') || '—'}</span
					>
				</div>
			{/if}
			{#if form.application.remarks}
				<div class="md:col-span-2 lg:col-span-3">
					<span class="text-muted-foreground">Remarks:</span>
					<span class="ml-1 font-medium">{form.application.remarks}</span>
				</div>
			{/if}
			<div>
				<span class="text-muted-foreground">Assigned Team:</span>
				<span class="ml-1 font-medium">{form.application.team_assigned || '—'}</span>
			</div>
		</div>
	</div>

	<!-- Documents Summary -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Documents</h3>
		{#if form.files.length > 0}
			<ul class="space-y-1 text-sm">
				{#each form.files as file, i (i)}
					<li class="flex items-center gap-2">
						<span class="min-w-0 flex-1 truncate text-foreground">{file.file.name}</span>
						<span class="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
							>{file.category}</span
						>
					</li>
				{/each}
			</ul>
		{:else if form.skip_files}
			<p class="text-sm text-muted-foreground">No documents — skipped by user.</p>
		{:else}
			<p class="text-sm text-muted-foreground">No documents uploaded.</p>
		{/if}
	</div>
</div>
