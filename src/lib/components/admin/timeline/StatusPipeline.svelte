<script lang="ts">
	import { APPLICATION_STATUS } from '$lib/constants/SchemaData';

	interface ComponentProps {
		currentStatus: string;
	}

	let { currentStatus }: ComponentProps = $props();

	const stages = APPLICATION_STATUS;
	const currentIndex = $derived(stages.indexOf(currentStatus as (typeof stages)[number]));
</script>

<div class="flex items-baseline gap-3 w-full overflow-x-auto py-2">
	{#each stages as stage, i (stage)}
		{@const isPast = i < currentIndex}
		{@const isCurrent = i === currentIndex}

		<div class="flex flex-col items-start gap-1 shrink-0">
			<span
				class="text-xs font-semibold leading-tight whitespace-nowrap {!isPast && !isCurrent ? 'text-muted-foreground/50' : ''}"
				class:text-emerald-600={isPast}
				class:dark:text-emerald-400={isPast}
				class:text-blue-600={isCurrent}
				class:dark:text-blue-400={isCurrent}
			>
				{stage}
			</span>
			<div
				class="h-1 w-full min-w-12 rounded-full transition-colors duration-300"
				class:bg-emerald-500={isPast}
				class:bg-blue-500={isCurrent}
				class:bg-muted={!isPast && !isCurrent}
			></div>
		</div>
	{/each}
</div>
