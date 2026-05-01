<script lang="ts">
	import { Download, Loader2 } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';

	interface ExportPdfButtonProps {
		targetElementId: string;
		filename?: string;
	}

	let { targetElementId, filename = 'report' }: ExportPdfButtonProps = $props();
	let isExporting = $state(false);

	async function exportPdf() {
		isExporting = true;
		try {
			const element = document.getElementById(targetElementId);
			if (!element) {
				console.error(`Element with id "${targetElementId}" not found.`);
				return;
			}

			const { default: html2pdf } = await import('html2pdf.js');

			// Use requestAnimationFrame to prevent UI freeze
			await new Promise<void>((resolve) => {
				requestAnimationFrame(() => {
					requestAnimationFrame(() => {
						resolve();
					});
				});
			});

			const opt = {
				margin: [10, 10, 10, 10] as [number, number, number, number],
				filename: `${filename}.pdf`,
				image: { type: 'jpeg' as const, quality: 0.95 },
				html2canvas: { scale: 2, useCORS: true, logging: false },
				jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const },
				pagebreak: { mode: ['avoid-all', 'css', 'legacy'] as string[] }
			};

			await html2pdf().set(opt).from(element).save();
		} catch (err) {
			console.error('PDF export failed:', err);
		} finally {
			isExporting = false;
		}
	}
</script>

<Button variant="outline" size="sm" class="gap-2" onclick={exportPdf} disabled={isExporting}>
	{#if isExporting}
		<Loader2 class="size-4! animate-spin" />
		Exporting...
	{:else}
		<Download class="size-4!" />
		Export PDF
	{/if}
</Button>
