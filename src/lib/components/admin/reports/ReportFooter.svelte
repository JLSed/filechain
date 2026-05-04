<script lang="ts">
	import KeyHighlights from './KeyHighlights.svelte';

	interface Highlight {
		text: string;
		type: 'positive' | 'neutral' | 'negative';
	}

	interface ReportFooterProps {
		highlights: Highlight[];
		companyName: string;
		contactInfo: string;
		registeredAddress: string;
	}

	let { highlights, companyName, contactInfo, registeredAddress }: ReportFooterProps = $props();
</script>

<div class="mt-6 border-t border-border pt-4">
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<div>
			<h4 class="mb-2 text-sm font-semibold text-foreground">Key Highlights</h4>
			<KeyHighlights {highlights} />
		</div>
		<div>
			<h4 class="mb-2 text-sm font-semibold text-foreground">Contact Information</h4>
			<div class="space-y-1 text-xs text-muted-foreground">
				<p>{companyName}</p>
				{#if registeredAddress}
					<p>{registeredAddress}</p>
				{/if}
				{#if contactInfo}
					<p>{contactInfo}</p>
				{/if}
			</div>
		</div>
	</div>
</div>
