<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { superForm } from 'sveltekit-superforms';
	import type { PageProps } from './$types';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { IpApplicationFormSchema } from '$lib/types/FormTypes';
	import type { IpApplicationFormData } from '$lib/types/FormTypes';
	import { goto } from '$app/navigation';
	import { toast } from 'svelte-sonner';

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
	import { uploadApplicationFiles } from '$lib/services/ip-application';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { deserialize } from '$app/forms';

	let { data }: PageProps = $props();

	let submitting = $state(false);

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

		try {
			const supabase = createBrowserClient();

			// 1. Submit the form data to the server action to save DB records
			const formDataPayload = new FormData();
			const payload = {
				client_profiles: $form.client_profiles,
				application: $form.application
			};
			formDataPayload.set('payload', JSON.stringify(payload));

			const response = await fetch('?/application', {
				method: 'POST',
				body: formDataPayload
			});

			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const message =
					(result.data as { message?: string })?.message ?? 'Failed to submit the application.';
				toast.error(message);
				return;
			}

			if (result.type === 'error') {
				toast.error(
					result.error?.message ?? 'An unexpected error occurred during server submission.'
				);
				return;
			}

			// 2. Upload files using the server-generated application_id
			if (result.type === 'success') {
				const applicationId = (result.data as { applicationId?: string })?.applicationId;
				if (applicationId) {
					await uploadApplicationFiles($form as IpApplicationFormData, supabase, applicationId);
				}
			}

			toast.success('Application submitted successfully', {
				description: `Application has been submitted.`
			});
			goto('/files');
		} catch (err) {
			const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
			toast.error('Failed to upload/submit application', {
				description: errorMessage
			});
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
			if (Array.isArray(value)) return value.length > 0;
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

	let baseStepComplete = $derived(STEP_LABELS.map((_, i) => isStepComplete(i)));
	let stepComplete = $derived(
		baseStepComplete.map((complete, i) => {
			if (i === STEP_LABELS.length - 1) {
				return baseStepComplete.every(Boolean);
			}
			return complete;
		})
	);
	let stepHasError = $derived(STEP_LABELS.map((_, i) => stepHasErrors(i)));
	let hasAnyErrors = $derived(stepHasError.some(Boolean));
	let allRequiredFieldsFilled = $derived(
		stepComplete.every((complete, i) => {
			const requiredFields = STEP_REQUIRED_FIELDS[i];
			if (!requiredFields || requiredFields.length === 0) return true;
			return complete;
		})
	);

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
					<ClientProfileStep
						{form}
						{errors}
						clientProfiles={data.clientProfiles}
						onClientSelected={nextStep}
					/>
				{:else if currentStep === 1}
					<ApplicationStep
						{form}
						{errors}
						inventionTypes={data.inventionTypes}
					/>
				{:else if currentStep === 2}
					<DocumentUploadStep {form} />
				{:else if currentStep === 3}
					<ReviewStep
						bind:form={$form}
						inventionTypes={data.inventionTypes}
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
					{#if currentStep === STEP_LABELS.length - 1}
						<Button type="submit" disabled={submitting || !allRequiredFieldsFilled || hasAnyErrors}>
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
