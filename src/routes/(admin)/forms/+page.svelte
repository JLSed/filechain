<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { IpApplicationFormSchema } from '$lib/types/FormTypes';

	import FormStepper from '$lib/components/admin/forms/FormStepper.svelte';
	import ClientProfileStep from '$lib/components/admin/forms/ClientProfileStep.svelte';
	import ApplicationStep from '$lib/components/admin/forms/ApplicationStep.svelte';
	import DocumentUploadStep from '$lib/components/admin/forms/DocumentUploadStep.svelte';
	import ReviewStep from '$lib/components/admin/forms/ReviewStep.svelte';
	import {
		STEP_LABELS,
		STEP_REQUIRED_FIELDS,
		STEP_FIELD_MAP
	} from '$lib/components/admin/forms/constants';

	let { data }: PageProps = $props();

	// superForm only needs the initial value; reactive updates aren't needed here
	const { form, errors, enhance } = superForm(data.form, {
		validators: zod4(IpApplicationFormSchema),
		dataType: 'json'
	});

	let currentStep = $state(0);

	/**
	 * Gets a nested value from an object using a dot-notation path.
	 */
	function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
		return path.split('.').reduce<unknown>((acc, key) => {
			if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
				return (acc as Record<string, unknown>)[key];
			}
			return undefined;
		}, obj);
	}

	/**
	 * Checks if a step has all required fields filled with non-empty values.
	 */
	function isStepComplete(stepIndex: number): boolean {
		const requiredFields = STEP_REQUIRED_FIELDS[stepIndex];
		if (!requiredFields || requiredFields.length === 0) return false;
		return requiredFields.every((field) => {
			const value = getNestedValue($form as unknown as Record<string, unknown>, field);
			if (value === null || value === undefined) return false;
			if (typeof value === 'string') return value.trim().length > 0;
			if (typeof value === 'number') return !Number.isNaN(value);
			return true;
		});
	}

	/**
	 * Checks if a step has any validation errors.
	 */
	function stepHasErrors(stepIndex: number): boolean {
		const fields = STEP_FIELD_MAP[stepIndex];
		if (!fields || fields.length === 0) return false;
		return fields.some((field) => {
			const value = getNestedValue($errors as unknown as Record<string, unknown>, field);
			if (Array.isArray(value) && value.length > 0) return true;
			if (value && typeof value === 'object') {
				return Object.values(value).some(
					(v) => (Array.isArray(v) && v.length > 0) || (v && typeof v === 'object')
				);
			}
			return false;
		});
	}

	let stepComplete = $derived(STEP_LABELS.map((_, i) => isStepComplete(i)));
	let stepHasError = $derived(STEP_LABELS.map((_, i) => stepHasErrors(i)));

	function goToStep(step: number) {
		currentStep = step;
	}

	function nextStep() {
		if (currentStep < STEP_LABELS.length - 1) currentStep++;
	}

	function prevStep() {
		if (currentStep > 0) currentStep--;
	}
</script>

<div class="flex h-full flex-col lg:flex-row">
	<FormStepper {STEP_LABELS} bind:currentStep {goToStep} {stepComplete} {stepHasError} />

	<div class="flex min-w-0 flex-1 flex-col">
		<form method="POST" action="?/application" use:enhance class="flex flex-1 flex-col p-6">
			<div class="flex-1">
				{#if currentStep === 0}
					<ClientProfileStep form={$form} errors={$errors} />
				{:else if currentStep === 1}
					<ApplicationStep
						form={$form}
						errors={$errors}
						inventionTypes={data.inventionTypes}
						protectionStatuses={data.protectionStatuses}
						officeActions={data.officeActions}
					/>
				{:else if currentStep === 2}
					<DocumentUploadStep />
				{:else if currentStep === 3}
					<ReviewStep
						form={$form}
						inventionTypes={data.inventionTypes}
						protectionStatuses={data.protectionStatuses}
						officeActions={data.officeActions}
					/>
				{/if}
			</div>

			<!-- Navigation buttons -->
			<div class="mt-8 flex items-center justify-between border-t border-border pt-4">
				<Button type="button" variant="outline" onclick={prevStep} disabled={currentStep === 0}>
					Previous
				</Button>

				{#if currentStep === STEP_LABELS.length - 1}
					<Button type="submit">Submit Application</Button>
				{:else}
					<Button type="button" onclick={nextStep}>Continue</Button>
				{/if}
			</div>
		</form>
	</div>
</div>
