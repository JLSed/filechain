<script lang="ts">
	import { Circle, CircleCheck, CircleAlert } from '@lucide/svelte';

	let {
		STEP_LABELS,
		currentStep = $bindable(0),
		goToStep,
		stepComplete,
		stepHasError
	}: {
		STEP_LABELS: readonly string[];
		currentStep: number;
		goToStep: (step: number) => void;
		stepComplete: boolean[];
		stepHasError: boolean[];
	} = $props();
</script>

<nav class="w-full p-6 lg:max-w-xs lg:shrink-0" aria-label="Form steps">
	<div class="relative">
		<!-- Background connecting line -->
		<div class="absolute top-0 bottom-0 left-5 w-0.5 bg-border"></div>
		<!-- Progress line -->
		<div
			class="absolute top-0 left-5 w-0.5 bg-primary transition-all duration-500"
			style="height: {(currentStep / (STEP_LABELS.length - 1)) * 100}%"
		></div>

		{#each STEP_LABELS as label, idx (label)}
			{@const isActive = idx === currentStep}
			{@const isCompleted = stepComplete[idx]}
			{@const hasError = stepHasError[idx]}
			<button
				type="button"
				onclick={() => goToStep(idx)}
				class="relative flex w-full items-start gap-3 text-left transition-all duration-200 hover:translate-x-0.5
					{idx === STEP_LABELS.length - 1 ? 'pb-0' : 'pb-6'}"
			>
				<div
					class="relative z-10 flex size-10 shrink-0 items-center justify-center rounded-full transition-all duration-300
						{hasError
						? 'bg-destructive text-white'
						: isCompleted
							? 'bg-primary text-primary-foreground'
							: isActive
								? 'border-[3px] border-primary bg-background'
								: 'border-2 border-muted-foreground/40 bg-background'}"
				>
					{#if hasError}
						<CircleAlert class="size-5" />
					{:else if isCompleted}
						<CircleCheck class="size-5" />
					{:else if isActive}
						<Circle class="size-3.5 fill-primary text-primary" />
					{:else}
						<Circle class="size-3.5 fill-muted-foreground/40 text-muted-foreground/40" />
					{/if}
				</div>
				<div class="flex-1 pt-1.5">
					<h3
						class="text-sm font-semibold
							{hasError
							? 'text-destructive'
							: isActive
								? 'text-primary'
								: isCompleted
									? 'text-foreground'
									: 'text-muted-foreground'}"
					>
						{label}
					</h3>
					<p
						class="mt-0.5 text-xs
							{hasError
							? 'text-destructive/70'
							: isActive
								? 'text-muted-foreground'
								: isCompleted
									? 'text-muted-foreground'
									: 'text-muted-foreground/60'}"
					>
						{hasError
							? 'Has errors'
							: isCompleted
								? 'Completed'
								: isActive
									? 'In Progress'
									: 'Pending'}
					</p>
				</div>
			</button>
		{/each}
	</div>
</nav>
