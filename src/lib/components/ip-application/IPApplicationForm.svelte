<script lang="ts">
	import { Button } from '$lib/shadcn/components/ui/button';
	import {
		Card,
		CardContent,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/shadcn/components/ui/card';
	import { Separator } from '$lib/shadcn/components/ui/separator';
	import { Check, ChevronLeft, ChevronRight, Loader2, FileCheck } from '@lucide/svelte';
	import StepClientInfo from './StepClientInfo.svelte';
	import StepApplicationDetails from './StepApplicationDetails.svelte';
	import StepDocumentUpload from './StepDocumentUpload.svelte';
	import StepInternalNotes from './StepInternalNotes.svelte';
	import StepFinalReview from './StepFinalReview.svelte';
	import {
		STEP_LABELS,
		type IpApplicationFormData,
		type TypeOfInvention,
		type PreProtectionStatus,
		type TypeOfOfficeAction
	} from '$lib/types/ip-application';
	import { submitIpApplication } from '$lib/utils/ip-application-submit';
	import { createBrowserClient } from '$lib/services/supabase/client';

	/** Generates an application number: {year}{day}{month}00{8 random digits} */
	function generateApplicationNumber(): string {
		const now = new Date();
		const year = now.getFullYear();
		const day = now.getDate();
		const month = now.getMonth() + 1;
		const random = Math.floor(1000 + Math.random() * 9000); // 4 digits
		return `${year}${day}${month}00${random}`;
	}

	let {
		inventionTypes,
		protectionStatuses,
		officeActions
	}: {
		inventionTypes: TypeOfInvention[];
		protectionStatuses: PreProtectionStatus[];
		officeActions: TypeOfOfficeAction[];
	} = $props();

	let currentStep = $state(0);
	let submitting = $state(false);
	let submitError = $state<string | null>(null);
	let submitSuccess = $state(false);

	let formData: IpApplicationFormData = $state({
		clientFirstName: '',
		clientMiddleName: '',
		clientLastName: '',
		clientEmail: '',
		clientMobileNumber: '',
		clientDialCode: '+63',
		clientNationality: '',
		clientCompany: '',
		clientCompanyAddress: '',
		titleOfInvention: '',
		typeOfInventionId: null,
		preProtectionStatusId: null,
		typeOfOfficeActionId: null,
		applicationNumber: generateApplicationNumber(),
		fillingDate: '',
		paperDocumentNo: '',
		fees: '',
		deadline: '',
		mailingDate: '',
		publicationDate: '',
		inventorNames: '',
		contactDetails: '',
		files: [],
		remarks: ''
	});

	const totalSteps = STEP_LABELS.length;
	const isFirstStep = $derived(currentStep === 0);
	const isLastStep = $derived(currentStep === totalSteps - 1);

	/** Basic per-step validation */
	function canProceed(): boolean {
		if (currentStep === 0) {
			return (
				formData.clientFirstName.trim() !== '' &&
				formData.clientLastName.trim() !== '' &&
				formData.clientEmail.trim() !== ''
			);
		}
		if (currentStep === 1) {
			return formData.typeOfInventionId !== null && formData.titleOfInvention.trim() !== '';
		}
		return true;
	}

	function nextStep() {
		if (currentStep < totalSteps - 1) {
			currentStep += 1;
		}
	}

	function prevStep() {
		if (currentStep > 0) {
			currentStep -= 1;
		}
	}

	function goToStep(step: number) {
		// Only allow navigating to already-visited steps or adjacent
		if (step <= currentStep) {
			currentStep = step;
		}
	}

	async function handleMarkAsFiled() {
		submitting = true;
		submitError = null;
		try {
			const supabase = createBrowserClient();
			await submitIpApplication(formData, supabase);
			submitSuccess = true;
		} catch (err) {
			submitError = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			submitting = false;
		}
	}
</script>

{#if submitSuccess}
	<!-- Success state -->
	<Card class="mx-auto max-w-2xl">
		<CardContent class="flex flex-col items-center gap-4 py-12">
			<div class="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
				<FileCheck class="size-8" />
			</div>
			<h2 class="text-xl font-semibold">Application Filed Successfully</h2>
			<p class="text-center text-sm text-muted-foreground">
				Application <strong>{formData.applicationNumber}</strong> has been marked as filed. All encrypted
				documents have been uploaded securely.
			</p>
			<Button
				variant="outline"
				onclick={() => {
					submitSuccess = false;
					currentStep = 0;
					formData = {
						clientFirstName: '',
						clientMiddleName: '',
						clientLastName: '',
						clientEmail: '',
						clientMobileNumber: '',
						clientDialCode: '+63',
						clientNationality: '',
						clientCompany: '',
						clientCompanyAddress: '',
						titleOfInvention: '',
						typeOfInventionId: null,
						preProtectionStatusId: null,
						typeOfOfficeActionId: null,
						applicationNumber: generateApplicationNumber(),
						fillingDate: '',
						paperDocumentNo: '',
						fees: '',
						deadline: '',
						mailingDate: '',
						publicationDate: '',
						inventorNames: '',
						contactDetails: '',
						files: [],
						remarks: ''
					};
				}}
			>
				File Another Application
			</Button>
		</CardContent>
	</Card>
{:else}
	<div class="flex flex-col gap-6 lg:flex-row">
		<!-- Stepper sidebar -->
		<nav class=" lg:w-60 lg:shrink-0" aria-label="Form steps">
			<ol class="flex gap-2 overflow-x-auto lg:flex-col lg:gap-0">
				{#each STEP_LABELS as label, idx (label)}
					{@const visited = idx < currentStep}
					{@const active = idx === currentStep}
					<li class="flex items-center lg:py-0">
						<button
							type="button"
							onclick={() => goToStep(idx)}
							disabled={idx > currentStep}
							class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-sm transition-colors
								{active ? 'bg-primary/10 font-semibold text-primary' : ''}
								{visited ? 'cursor-pointer text-foreground hover:bg-secondary/10' : ''}
								{!active && !visited ? 'cursor-not-allowed text-muted-foreground' : ''}"
						>
							<span
								class="flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold
									{active ? 'bg-primary text-primary-foreground' : ''}
									{visited ? 'bg-secondary/20 text-secondary' : ''}
									{!active && !visited ? 'bg-muted text-muted-foreground' : ''}"
							>
								{#if visited}
									<Check class="size-3.5" />
								{:else}
									{idx + 1}
								{/if}
							</span>
							<span class="hidden whitespace-nowrap lg:inline {visited ? 'text-secondary' : ''}"
								>{label}</span
							>
						</button>
					</li>
				{/each}
			</ol>
		</nav>

		<!-- Form card -->
		<Card class="flex-1 border-0 shadow-none">
			<CardHeader>
				<CardTitle class="text-2xl text-secondary">{STEP_LABELS[currentStep]}</CardTitle>
				<p class="text-sm text-muted-foreground">
					Step {currentStep + 1} of {totalSteps}
				</p>
			</CardHeader>

			<Separator />

			<CardContent class="pt-6">
				{#if currentStep === 0}
					<StepClientInfo bind:formData />
				{:else if currentStep === 1}
					<StepApplicationDetails
						bind:formData
						{inventionTypes}
						{protectionStatuses}
						{officeActions}
					/>
				{:else if currentStep === 2}
					<StepDocumentUpload bind:formData />
				{:else if currentStep === 3}
					<StepInternalNotes bind:formData />
				{:else if currentStep === 4}
					<StepFinalReview {formData} {inventionTypes} {protectionStatuses} {officeActions} />
				{/if}
			</CardContent>

			<Separator />

			<CardFooter class="flex items-center justify-between pt-4">
				<Button variant="outline" disabled={isFirstStep || submitting} onclick={prevStep}>
					<ChevronLeft class="mr-1 size-4" />
					Back
				</Button>

				{#if submitError}
					<p class="max-w-xs text-center text-xs text-destructive">{submitError}</p>
				{/if}

				{#if isLastStep}
					<Button disabled={submitting} onclick={handleMarkAsFiled} class="gap-2">
						{#if submitting}
							<Loader2 class="size-4 animate-spin" />
							Filing…
						{:else}
							<FileCheck class="size-4" />
							Mark as Filed
						{/if}
					</Button>
				{:else}
					<Button disabled={!canProceed()} onclick={nextStep}>
						Continue
						<ChevronRight class="ml-1 size-4" />
					</Button>
				{/if}
			</CardFooter>
		</Card>
	</div>
{/if}
