<script lang="ts">
	import { Input } from '$lib/shadcn/components/ui/input';
	import { Label } from '$lib/shadcn/components/ui/label';
	import { Textarea } from '$lib/shadcn/components/ui/textarea';
	import * as Select from '$lib/shadcn/components/ui/select';
	import DatePicker from '$lib/components/ip-application/DatePicker.svelte';
	import type {
		IpApplicationFormData,
		TypeOfInvention,
		PreProtectionStatus,
		TypeOfOfficeAction
	} from '$lib/types/ip-application';

	let {
		formData = $bindable(),
		inventionTypes,
		protectionStatuses,
		officeActions
	}: {
		formData: IpApplicationFormData;
		inventionTypes: TypeOfInvention[];
		protectionStatuses: PreProtectionStatus[];
		officeActions: TypeOfOfficeAction[];
	} = $props();

	const selectedInventionType = $derived(
		inventionTypes.find((t) => t.id === formData.typeOfInventionId)
	);

	/** Show extra patent-specific fields when "Patent" is selected */
	const isPatent = $derived(selectedInventionType?.name === 'Patent');

	/** Show design-specific fields when "Industrial Design" is selected */
	const isDesign = $derived(selectedInventionType?.name === 'Industrial Design');

	function handleInventionTypeChange(value: string | undefined) {
		formData.typeOfInventionId = value ? Number(value) : null;
	}

	function handleProtectionStatusChange(value: string | undefined) {
		formData.preProtectionStatusId = value ? Number(value) : null;
	}

	function handleOfficeActionChange(value: string | undefined) {
		formData.typeOfOfficeActionId = value ? Number(value) : null;
	}
</script>

<div class="space-y-6">
	<!-- Type of Invention selector -->
	<div class="space-y-2">
		<Label>Type of Invention <span class="text-destructive">*</span></Label>
		<Select.Root
			type="single"
			value={formData.typeOfInventionId?.toString()}
			onValueChange={handleInventionTypeChange}
		>
			<Select.Trigger class="w-full">
				{selectedInventionType?.name ?? 'Select invention type'}
			</Select.Trigger>
			<Select.Content>
				{#each inventionTypes as t (t.id)}
					<Select.Item value={t.id.toString()}>{t.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Application Number -->
		<div class="space-y-2">
			<Label for="app-number">Application Number</Label>
			<Input
				id="app-number"
				value={formData.applicationNumber}
				readonly
				class="cursor-not-allowed bg-muted font-mono text-primary select-all"
			/>
		</div>

		<!-- Title of Invention -->
		<div class="space-y-2">
			<Label for="title">Title of Invention <span class="text-destructive">*</span></Label>
			<Input
				id="title"
				placeholder="Descriptive title"
				bind:value={formData.titleOfInvention}
				required
			/>
		</div>

		<!-- Filing Date -->
		<div class="space-y-2">
			<Label for="filling-date">Filing Date</Label>
			<DatePicker
				id="filling-date"
				bind:value={formData.fillingDate}
				placeholder="Select filing date"
			/>
		</div>

		<!-- Deadline -->
		<div class="space-y-2">
			<Label for="deadline">Deadline</Label>
			<DatePicker id="deadline" bind:value={formData.deadline} placeholder="Select deadline" />
		</div>

		<!-- Fees -->
		<div class="space-y-2">
			<Label for="fees">Fees (PHP)</Label>
			<Input id="fees" type="number" step="0.01" placeholder="0.00" bind:value={formData.fees} />
		</div>

		<!-- Paper Document No -->
		<div class="space-y-2">
			<Label for="paper-doc">Paper Document No.</Label>
			<Input id="paper-doc" placeholder="Paper doc number" bind:value={formData.paperDocumentNo} />
		</div>
	</div>

	<!-- Patent-specific fields -->
	{#if isPatent}
		<div class="grid gap-6 md:grid-cols-2">
			<div class="space-y-2">
				<Label for="mailing-date">Mailing Date</Label>
				<DatePicker
					id="mailing-date"
					bind:value={formData.mailingDate}
					placeholder="Select mailing date"
				/>
			</div>
			<div class="space-y-2">
				<Label for="publication-date">Publication Date</Label>
				<DatePicker
					id="publication-date"
					bind:value={formData.publicationDate}
					placeholder="Select publication date"
				/>
			</div>
		</div>
	{/if}

	<!-- Industrial Design: no extra fields, but show a guidance note -->
	{#if isDesign}
		<p class="text-sm text-muted-foreground">
			For Industrial Design applications, ensure drawings are uploaded in Step 3.
		</p>
	{/if}

	<!-- Inventor names -->
	<div class="space-y-2">
		<Label for="inventors">Inventor Name(s)</Label>
		<Textarea
			id="inventors"
			placeholder="Separate multiple inventors with commas"
			bind:value={formData.inventorNames}
			rows={2}
		/>
		<p class="text-xs text-muted-foreground">Comma-separated list of inventor names.</p>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Contact Details -->
		<div class="space-y-2">
			<Label for="contact">Contact Details</Label>
			<Input id="contact" placeholder="Phone / Fax" bind:value={formData.contactDetails} />
		</div>
	</div>

	<div class="grid gap-6 md:grid-cols-2">
		<!-- Pre-Protection Status -->
		<div class="space-y-2">
			<Label>Pre-Protection Status</Label>
			<Select.Root
				type="single"
				value={formData.preProtectionStatusId?.toString()}
				onValueChange={handleProtectionStatusChange}
			>
				<Select.Trigger class="w-full">
					{protectionStatuses.find((s) => s.id === formData.preProtectionStatusId)?.name ??
						'Select status'}
				</Select.Trigger>
				<Select.Content>
					{#each protectionStatuses as s (s.id)}
						<Select.Item value={s.id.toString()}>{s.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>

		<!-- Type of Office Action -->
		<div class="space-y-2">
			<Label>Type of Office Action</Label>
			<Select.Root
				type="single"
				value={formData.typeOfOfficeActionId?.toString()}
				onValueChange={handleOfficeActionChange}
			>
				<Select.Trigger class="w-full">
					{officeActions.find((a) => a.id === formData.typeOfOfficeActionId)?.name ??
						'Select office action'}
				</Select.Trigger>
				<Select.Content>
					{#each officeActions as a (a.id)}
						<Select.Item value={a.id.toString()}>{a.name}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	</div>
</div>
