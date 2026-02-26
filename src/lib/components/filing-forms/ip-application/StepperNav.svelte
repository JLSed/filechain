<script>
	import { Check } from '@lucide/svelte';
	let { STEP_LABELS, currentStep = $bindable(0), goToStep } = $props();
</script>

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
