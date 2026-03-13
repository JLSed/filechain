<script lang="ts">
	import { untrack } from 'svelte';
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Progress from '$lib/shadcn/components/ui/progress/progress.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import {
		ShieldCheck,
		ShieldX,
		CircleCheck,
		CircleX,
		TriangleAlert,
		Loader2,
		Circle
	} from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import {
		createInitialSteps,
		runIntegrityCheck,
		type IntegrityStep,
		type StepStatus
	} from '$lib/utils/file-integrity';

	interface Props {
		file: FileMetadata | null;
		open: boolean;
		onclose: () => void;
	}

	let { file, open = $bindable(), onclose }: Props = $props();

	let steps = $state<IntegrityStep[]>(createInitialSteps());
	let running = $state(false);
	let overallPassed = $state<boolean | null>(null);
	let currentStepIndex = $state(-1);

	const progress = $derived(() => {
		const completed = steps.filter(
			(s) => s.status === 'passed' || s.status === 'failed' || s.status === 'warning'
		).length;
		return Math.round((completed / steps.length) * 100);
	});

	const currentLabel = $derived(() => {
		if (currentStepIndex >= 0 && currentStepIndex < steps.length) {
			const step = steps[currentStepIndex];
			if (step.status === 'running') return step.label;
		}
		if (overallPassed === true) return 'All checks passed';
		if (overallPassed === false) return 'Integrity issues detected';
		return 'Starting verification…';
	});

	function reset(): void {
		steps = createInitialSteps();
		running = false;
		overallPassed = null;
		currentStepIndex = -1;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	async function startVerification(): Promise<void> {
		if (!file || running) return;

		reset();
		running = true;

		try {
			const supabase = createBrowserClient();
			const result = await runIntegrityCheck(supabase, file, (updatedSteps, index) => {
				steps = updatedSteps;
				currentStepIndex = index;
			});

			overallPassed = result.overallPassed;
		} catch {
			overallPassed = false;
		} finally {
			running = false;
		}
	}

	$effect(() => {
		if (open && file) {
			untrack(() => startVerification());
		}
	});

	function getStatusIcon(
		status: StepStatus
	): typeof CircleCheck | typeof CircleX | typeof TriangleAlert | typeof Loader2 | typeof Circle {
		switch (status) {
			case 'passed':
				return CircleCheck;
			case 'failed':
				return CircleX;
			case 'warning':
				return TriangleAlert;
			case 'running':
				return Loader2;
			default:
				return Circle;
		}
	}

	function getStatusColor(status: StepStatus): string {
		switch (status) {
			case 'passed':
				return 'text-emerald-500';
			case 'failed':
				return 'text-destructive';
			case 'warning':
				return 'text-amber-500';
			case 'running':
				return 'text-primary';
			default:
				return 'text-muted-foreground/40';
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if overallPassed === true}
					<ShieldCheck class="size-5 text-emerald-500" />
				{:else if overallPassed === false}
					<ShieldX class="size-5 text-destructive" />
				{:else}
					<ShieldCheck class="size-5 text-primary" />
				{/if}
				Verify File Integrity
			</Dialog.Title>
			<Dialog.Description>
				{#if file}
					Checking integrity of <span class="font-medium">{file.file_name}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-2">
			<!-- Progress bar -->
			<div class="space-y-2">
				<Progress value={progress()} max={100} class="h-2" />
				<p class="text-xs text-muted-foreground">
					{currentLabel()}
					{#if running}
						<span class="ml-1 text-primary">({progress()}%)</span>
					{/if}
				</p>
			</div>

			<!-- Steps checklist -->
			<div class="space-y-1">
				{#each steps as step (step.id)}
					{@const IconComponent = getStatusIcon(step.status)}
					<div
						class="flex items-start gap-3 rounded-md px-3 py-2 transition-colors {step.status ===
						'running'
							? 'bg-muted/50'
							: ''}"
					>
						<div class="mt-0.5 shrink-0">
							<IconComponent
								class="size-4 {getStatusColor(step.status)} {step.status === 'running'
									? 'animate-spin'
									: ''}"
							/>
						</div>
						<div class="min-w-0 flex-1">
							<p
								class="text-sm font-medium {step.status === 'pending'
									? 'text-muted-foreground/50'
									: 'text-foreground'}"
							>
								{step.label}
							</p>
							{#if step.detail}
								<p
									class="mt-0.5 truncate text-xs {step.status === 'failed'
										? 'text-destructive/80'
										: step.status === 'warning'
											? 'text-amber-500/80'
											: 'text-muted-foreground'}"
								>
									{step.detail}
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<!-- Final result badge -->
			{#if !running && overallPassed !== null}
				<div class="flex items-center justify-center pt-1">
					{#if overallPassed}
						<Badge
							variant="secondary"
							class="gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-600"
						>
							<ShieldCheck class="size-3.5" />
							File integrity verified
						</Badge>
					{:else}
						<Badge
							variant="secondary"
							class="gap-1.5 border-destructive/20 bg-destructive/10 px-3 py-1.5 text-destructive"
						>
							<ShieldX class="size-3.5" />
							Integrity issues detected
						</Badge>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button
				type="button"
				variant={overallPassed === null ? 'outline' : 'default'}
				onclick={() => handleOpenChange(false)}
				disabled={running}
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
