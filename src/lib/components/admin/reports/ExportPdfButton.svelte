<script lang="ts">
	import { Download, Loader2 } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { toast } from 'svelte-sonner';

	interface ExportPdfButtonProps {
		/** Async callback that builds and saves the PDF using PdfReportBuilder. */
		buildPdf: () => Promise<void>;
	}

	let { buildPdf }: ExportPdfButtonProps = $props();
	let isExporting = $state(false);

	async function handleExport() {
		isExporting = true;
		try {
			// Yield a frame so the UI can show the loading state
			await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

			await buildPdf();

			toast.success('PDF exported successfully.');
		} catch (err) {
			console.error('PDF export failed:', err);
			toast.error('Failed to export PDF. Please try again.');
		} finally {
			isExporting = false;
		}
	}
</script>

<Button variant="outline" size="sm" class="gap-2" onclick={handleExport} disabled={isExporting}>
	{#if isExporting}
		<Loader2 class="size-4! animate-spin" />
		Exporting...
	{:else}
		<Download class="size-4!" />
		Export PDF
	{/if}
</Button>
