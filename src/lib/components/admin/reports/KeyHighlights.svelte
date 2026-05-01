<script lang="ts">
	interface Highlight {
		text: string;
		type: 'positive' | 'neutral' | 'negative';
	}

	interface KeyHighlightsProps {
		highlights: Highlight[];
	}

	let { highlights }: KeyHighlightsProps = $props();

	const dotColors: Record<string, string> = {
		positive: 'bg-emerald-500',
		neutral: 'bg-blue-500',
		negative: 'bg-red-500'
	};
</script>

<div class="space-y-2">
	{#each highlights as highlight (highlight.text)}
		<div class="flex items-start gap-2">
			<span
				class="mt-1.5 size-2 shrink-0 rounded-full {dotColors[highlight.type] ?? dotColors.neutral}"
			></span>
			<p class="text-xs text-muted-foreground">{highlight.text}</p>
		</div>
	{/each}
</div>
