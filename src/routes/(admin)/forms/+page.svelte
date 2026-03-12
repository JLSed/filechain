<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type { IpApplicationFormData } from '$lib/types/FormTypes';
	import { goto } from '$app/navigation';

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
	import { untrack } from 'svelte';
	import { submitIpApplication } from '$lib/services/ip-application';
	import { createBrowserClient } from '$lib/services/supabase/client';

	let { data }: PageProps = $props();

	let submitting = $state(false);
	let submitError = $state<string | null>(null);

	const { form, errors, enhance } = superForm(
		untrack(() => data.form),
		{
			validators: zod4(IpApplicationFormSchema),
			dataType: 'json',
			resetForm: false,
			onSubmit: ({ cancel }) => {
				cancel();
				handleClientSubmit();
			}
		}
	);

	async function handleClientSubmit() {
		submitting = true;
		submitError = null;

		try {
			const supabase = createBrowserClient();
			await submitIpApplication($form as IpApplicationFormData, supabase);
			goto('/files');
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'An unexpected error occurred.';
		} finally {
			submitting = false;
		}
	}

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
					<ClientProfileStep {form} {errors} />
				{:else if currentStep === 1}
					<ApplicationStep
						{form}
						{errors}
						inventionTypes={data.inventionTypes}
						protectionStatuses={data.protectionStatuses}
						officeActions={data.officeActions}
					/>
				{:else if currentStep === 2}
					<DocumentUploadStep {form} />
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
				<Button
					type="button"
					variant="outline"
					onclick={prevStep}
					disabled={currentStep === 0 || submitting}
				>
					Previous
				</Button>

				<div class="flex items-center gap-3">
					{#if submitError}
						<p class="max-w-sm text-sm text-destructive">{submitError}</p>
					{/if}

					{#if currentStep === STEP_LABELS.length - 1}
						<Button type="submit" disabled={submitting}>
							{submitting ? 'Submitting...' : 'Submit Application'}
						</Button>
					{:else}
						<Button type="button" onclick={nextStep}>Continue</Button>
					{/if}
				</div>
			</div>
		</form>
	</div>
</div>
