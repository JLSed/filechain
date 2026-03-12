<script lang="ts">
	import type { Infer, ValidationErrors } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type {
		TypeOfInvention,
		PreProtectionStatus,
		TypeOfOfficeAction
	} from '$lib/types/DatabaseTypes';
	import type { Writable } from 'svelte/store';
	import { APPLICATION_STATUS } from '$lib/constants/SchemaData';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { X } from '@lucide/svelte';
	import { generateApplicationNumber } from '$lib/utils/generator';

	let {
		form,
		errors,
		inventionTypes,
		protectionStatuses,
		officeActions
	}: {
		form: Writable<Infer<typeof IpApplicationFormSchema>>;
		errors: Writable<ValidationErrors<Infer<typeof IpApplicationFormSchema>>>;
		inventionTypes: TypeOfInvention[];
		protectionStatuses: PreProtectionStatus[];
		officeActions: TypeOfOfficeAction[];
	} = $props();

	function addInventor() {
		$form.application.inventor_names = [...$form.application.inventor_names, ''];
	}

	function removeInventor(index: number) {
		$form.application.inventor_names = $form.application.inventor_names.filter(
			(_, i) => i !== index
		);
	}

	$effect(() => {
		if (!$form.application.application_number) {
			$form.application.application_number = generateApplicationNumber();
		}
	});
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Application Details</h2>
		<p class="text-sm text-muted-foreground">
			Enter the intellectual property application information.
		</p>
	</div>

	<!-- Basic Application Info -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		<div class="space-y-1.5">
			<label for="application_number" class="text-sm font-medium text-foreground"
				>Application Number</label
			>
			<Input
				id="application_number"
				bind:value={$form.application.application_number}
				placeholder="Generating..."
				readonly
				class="cursor-not-allowed opacity-75"
				aria-invalid={$errors.application?.application_number ? 'true' : undefined}
			/>
			{#if $errors.application?.application_number}
				<p class="text-xs text-destructive">{$errors.application.application_number}</p>
			{/if}
		</div>

		<div class="space-y-1.5 md:col-span-2">
			<label for="title_of_invention" class="text-sm font-medium text-foreground">
				Title of Invention <span class="text-destructive">*</span>
			</label>
			<Input
				id="title_of_invention"
				bind:value={$form.application.title_of_invention}
				placeholder="Title of Invention"
				required
				aria-invalid={$errors.application?.title_of_invention ? 'true' : undefined}
			/>
			{#if $errors.application?.title_of_invention}
				<p class="text-xs text-destructive">{$errors.application.title_of_invention}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="status" class="text-sm font-medium text-foreground">
				Status <span class="text-destructive">*</span>
			</label>
			<select
				id="status"
				bind:value={$form.application.status}
				class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				required
				aria-invalid={$errors.application?.status ? 'true' : undefined}
			>
				{#each APPLICATION_STATUS as status (status)}
					<option value={status}>{status}</option>
				{/each}
			</select>
			{#if $errors.application?.status}
				<p class="text-xs text-destructive">{$errors.application.status}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="type_of_invention_id" class="text-sm font-medium text-foreground">
				Type of Invention <span class="text-destructive">*</span>
			</label>
			<select
				id="type_of_invention_id"
				bind:value={$form.application.type_of_invention_id}
				class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				required
				aria-invalid={$errors.application?.type_of_invention_id ? 'true' : undefined}
			>
				<option value={0} disabled>Select type...</option>
				{#each inventionTypes.filter(Boolean) as type (type!.id)}
					<option value={type!.id}>{type!.name}</option>
				{/each}
			</select>
			{#if $errors.application?.type_of_invention_id}
				<p class="text-xs text-destructive">{$errors.application.type_of_invention_id}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="pre_protection_status_id" class="text-sm font-medium text-foreground">
				Pre-Protection Status <span class="text-destructive">*</span>
			</label>
			<select
				id="pre_protection_status_id"
				bind:value={$form.application.pre_protection_status_id}
				class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				required
				aria-invalid={$errors.application?.pre_protection_status_id ? 'true' : undefined}
			>
				<option value={0} disabled>Select status...</option>
				{#each protectionStatuses.filter(Boolean) as status (status!.id)}
					<option value={status!.id}>{status!.name}</option>
				{/each}
			</select>
			{#if $errors.application?.pre_protection_status_id}
				<p class="text-xs text-destructive">{$errors.application.pre_protection_status_id}</p>
			{/if}
		</div>
	</div>

	<!-- Type & Dates -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		<div class="space-y-1.5">
			<label for="type_of_office_action_id" class="text-sm font-medium text-foreground">
				Type of Office Action <span class="text-destructive">*</span>
			</label>
			<select
				id="type_of_office_action_id"
				bind:value={$form.application.type_of_office_action_id}
				class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				required
				aria-invalid={$errors.application?.type_of_office_action_id ? 'true' : undefined}
			>
				<option value={0} disabled>Select action...</option>
				{#each officeActions.filter(Boolean) as action (action!.id)}
					<option value={action!.id}>{action!.name}</option>
				{/each}
			</select>
			{#if $errors.application?.type_of_office_action_id}
				<p class="text-xs text-destructive">{$errors.application.type_of_office_action_id}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="filling_date" class="text-sm font-medium text-foreground">Filing Date</label>
			<Input
				id="filling_date"
				type="date"
				bind:value={$form.application.filling_date}
				aria-invalid={$errors.application?.filling_date ? 'true' : undefined}
			/>
			{#if $errors.application?.filling_date}
				<p class="text-xs text-destructive">{$errors.application.filling_date}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="deadline" class="text-sm font-medium text-foreground">Deadline</label>
			<Input
				id="deadline"
				type="date"
				bind:value={$form.application.deadline}
				aria-invalid={$errors.application?.deadline ? 'true' : undefined}
			/>
			{#if $errors.application?.deadline}
				<p class="text-xs text-destructive">{$errors.application.deadline}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="mailing_date" class="text-sm font-medium text-foreground">Mailing Date</label>
			<Input
				id="mailing_date"
				type="date"
				bind:value={$form.application.mailing_date}
				aria-invalid={$errors.application?.mailing_date ? 'true' : undefined}
			/>
			{#if $errors.application?.mailing_date}
				<p class="text-xs text-destructive">{$errors.application.mailing_date}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="publication_date" class="text-sm font-medium text-foreground"
				>Publication Date</label
			>
			<Input
				id="publication_date"
				type="date"
				bind:value={$form.application.publication_date}
				aria-invalid={$errors.application?.publication_date ? 'true' : undefined}
			/>
			{#if $errors.application?.publication_date}
				<p class="text-xs text-destructive">{$errors.application.publication_date}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="paper_document_no" class="text-sm font-medium text-foreground"
				>Paper Document No.</label
			>
			<Input
				id="paper_document_no"
				bind:value={$form.application.paper_document_no}
				placeholder="Paper Document No."
				aria-invalid={$errors.application?.paper_document_no ? 'true' : undefined}
			/>
			{#if $errors.application?.paper_document_no}
				<p class="text-xs text-destructive">{$errors.application.paper_document_no}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="fees" class="text-sm font-medium text-foreground">Fees</label>
			<Input
				id="fees"
				type="number"
				bind:value={$form.application.fees}
				placeholder="0.00"
				aria-invalid={$errors.application?.fees ? 'true' : undefined}
			/>
			{#if $errors.application?.fees}
				<p class="text-xs text-destructive">{$errors.application.fees}</p>
			{/if}
		</div>
	</div>

	<!-- Contact Details & Remarks -->
	<div class="grid grid-cols-1 gap-4">
		<div class="space-y-1.5">
			<label for="contact_details" class="text-sm font-medium text-foreground"
				>Contact Details</label
			>
			<textarea
				id="contact_details"
				bind:value={$form.application.contact_details}
				placeholder="Additional contact details..."
				rows="2"
				class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				aria-invalid={$errors.application?.contact_details ? 'true' : undefined}
			></textarea>
			{#if $errors.application?.contact_details}
				<p class="text-xs text-destructive">{$errors.application.contact_details}</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="remarks" class="text-sm font-medium text-foreground">Remarks</label>
			<textarea
				id="remarks"
				bind:value={$form.application.remarks}
				placeholder="Additional remarks..."
				rows="3"
				class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
				aria-invalid={$errors.application?.remarks ? 'true' : undefined}
			></textarea>
			{#if $errors.application?.remarks}
				<p class="text-xs text-destructive">{$errors.application.remarks}</p>
			{/if}
		</div>
	</div>

	<!-- Inventor Names -->
	<div class="space-y-3">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-foreground">Inventor Names</span>
			<Button type="button" variant="outline" size="sm" onclick={addInventor}>
				+ Add Inventor
			</Button>
		</div>
		{#if $errors.application?.inventor_names?._errors}
			<p class="text-xs text-destructive">{$errors.application.inventor_names._errors}</p>
		{/if}
		<!-- eslint-disable-next-line -->
		{#each $form.application.inventor_names as _, i (i)}
			<div class="flex items-center gap-2">
				<Input
					bind:value={$form.application.inventor_names[i]}
					placeholder="Inventor name"
					aria-invalid={$errors.application?.inventor_names?.[i] ? 'true' : undefined}
				/>
				<Button type="button" variant="ghost" size="icon-sm" onclick={() => removeInventor(i)}>
					<X class="size-4" />
				</Button>
			</div>
			{#if $errors.application?.inventor_names?.[i]}
				<p class="text-xs text-destructive">{$errors.application.inventor_names[i]}</p>
			{/if}
		{/each}
	</div>
</div>
