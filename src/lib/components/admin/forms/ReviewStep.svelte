<script lang="ts">
	import type { Infer } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type {
		TypeOfInvention,
		PreProtectionStatus,
		TypeOfOfficeAction
	} from '$lib/types/DatabaseTypes';

	let {
		form,
		inventionTypes,
		protectionStatuses,
		officeActions
	}: {
		form: Infer<typeof IpApplicationFormSchema>;
		inventionTypes: (TypeOfInvention & {})[];
		protectionStatuses: (PreProtectionStatus & {})[];
		officeActions: (TypeOfOfficeAction & {})[];
	} = $props();

	function getInventionTypeName(id: number): string {
		return inventionTypes.find((t) => t.id === id)?.name ?? '—';
	}

	function getProtectionStatusName(id: number): string {
		return protectionStatuses.find((s) => s.id === id)?.name ?? '—';
	}

	function getOfficeActionName(id: number): string {
		return officeActions.find((a) => a.id === id)?.name ?? '—';
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Review & Submit</h2>
		<p class="text-sm text-muted-foreground">Review the information below before submitting.</p>
	</div>

	<!-- Client Information -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Client Information</h3>
		<div class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2 lg:grid-cols-3">
			<div>
				<span class="text-muted-foreground">Name:</span>
				<span class="ml-1 font-medium"
					>{form.client_profiles.first_name}
					{form.client_profiles.middle_name}
					{form.client_profiles.last_name}</span
				>
			</div>
			<div>
				<span class="text-muted-foreground">Email:</span>
				<span class="ml-1 font-medium">{form.client_profiles.email || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Mobile:</span>
				<span class="ml-1 font-medium">{form.client_profiles.mobile_number || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Nationality:</span>
				<span class="ml-1 font-medium">{form.client_profiles.nationality || '—'}</span>
			</div>
			<div class="md:col-span-2">
				<span class="text-muted-foreground">Company:</span>
				<span class="ml-1 font-medium">{form.client_profiles.company_name || '—'}</span>
			</div>
			<div class="md:col-span-2 lg:col-span-3">
				<span class="text-muted-foreground">Address:</span>
				<span class="ml-1 font-medium">{form.client_profiles.company_address || '—'}</span>
			</div>
		</div>
	</div>

	<!-- Application Details -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Application Details</h3>
		<div class="grid grid-cols-1 gap-x-6 gap-y-2 text-sm md:grid-cols-2 lg:grid-cols-3">
			<div>
				<span class="text-muted-foreground">Application No.:</span>
				<span class="ml-1 font-medium">{form.application.application_number || '—'}</span>
			</div>
			<div class="md:col-span-2">
				<span class="text-muted-foreground">Title:</span>
				<span class="ml-1 font-medium">{form.application.title_of_invention || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Status:</span>
				<span class="ml-1 font-medium">{form.application.status || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Type of Invention:</span>
				<span class="ml-1 font-medium"
					>{getInventionTypeName(form.application.type_of_invention_id)}</span
				>
			</div>
			<div>
				<span class="text-muted-foreground">Pre-Protection Status:</span>
				<span class="ml-1 font-medium"
					>{getProtectionStatusName(form.application.pre_protection_status_id)}</span
				>
			</div>
			<div>
				<span class="text-muted-foreground">Office Action:</span>
				<span class="ml-1 font-medium"
					>{getOfficeActionName(form.application.type_of_office_action_id)}</span
				>
			</div>
			<div>
				<span class="text-muted-foreground">Filing Date:</span>
				<span class="ml-1 font-medium">{form.application.filling_date || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Deadline:</span>
				<span class="ml-1 font-medium">{form.application.deadline || '—'}</span>
			</div>
			<div>
				<span class="text-muted-foreground">Fees:</span>
				<span class="ml-1 font-medium">{form.application.fees ?? '—'}</span>
			</div>
			<div class="md:col-span-2 lg:col-span-3">
				<span class="text-muted-foreground">Link to Folder:</span>
				<span class="ml-1 font-medium">{form.application.link_to_folder || '—'}</span>
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
		</div>
	</div>

	<!-- Documents Summary -->
	<div class="space-y-3 rounded-lg border border-border p-4">
		<h3 class="text-sm font-semibold text-foreground">Documents</h3>
		{#if form.files.length > 0}
			<ul class="list-inside list-disc space-y-1 text-sm">
				{#each form.files as file, i (i)}
					<li>
						<span class="font-medium">{file.category}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-muted-foreground">No documents uploaded.</p>
		{/if}
	</div>
</div>
