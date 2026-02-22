<script lang="ts">
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Download, Eye, FileText, X } from '@lucide/svelte';
	import type { DecryptedFileView } from '$lib/types/file';
	import { isPdf, isImage, isText } from '$lib/utils/file';

	interface Props {
		/** The decrypted file to display */
		fileView: DecryptedFileView;
		/** Called when the viewer should be closed */
		onclose: () => void;
	}

	let { fileView, onclose }: Props = $props();

	function handleDownload(): void {
		const blob = new Blob([fileView.data.buffer as ArrayBuffer], { type: fileView.mimeType });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = fileView.fileName;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}

	function handleClose(): void {
		URL.revokeObjectURL(fileView.blobUrl);
		onclose();
	}
</script>

<div class="flex h-full flex-col">
	<!-- Top bar -->
	<div
		class="flex items-center justify-between border-b border-border bg-background px-6 py-3 shadow-sm"
	>
		<div class="flex min-w-0 items-center gap-3">
			<Eye class="size-5 shrink-0 text-primary" />
			<h2 class="truncate text-base font-semibold text-foreground">
				{fileView.fileName}
			</h2>
		</div>
		<div class="flex shrink-0 items-center gap-2">
			<Button variant="default" size="sm" onclick={handleDownload}>
				<Download class="size-4" />
				Download
			</Button>
			<Button variant="outline" size="sm" onclick={handleClose}>
				<X class="size-4" />
				Close
			</Button>
		</div>
	</div>

	<!-- Content area -->
	<div class="flex-1 overflow-auto bg-muted">
		{#if isPdf(fileView.mimeType)}
			<iframe src={fileView.blobUrl} class="h-full w-full" title={fileView.fileName}></iframe>
		{:else if isImage(fileView.mimeType)}
			<div class="flex min-h-full items-center justify-center p-8">
				<img
					src={fileView.blobUrl}
					alt={fileView.fileName}
					class="max-h-full max-w-full rounded-lg object-contain shadow-lg"
				/>
			</div>
		{:else if isText(fileView.mimeType)}
			{#await fetch(fileView.blobUrl).then((r) => r.text())}
				<div class="flex min-h-full items-center justify-center p-8">
					<p class="text-sm text-muted-foreground">Loading…</p>
				</div>
			{:then text}
				<div class="p-8">
					<pre
						class="mx-auto max-w-4xl overflow-auto rounded-lg bg-background p-6 font-mono text-sm whitespace-pre-wrap text-foreground shadow-sm">{text}</pre>
				</div>
			{:catch}
				<div class="flex min-h-full items-center justify-center p-8">
					<p class="text-sm text-destructive">Failed to load text content</p>
				</div>
			{/await}
		{:else}
			<div class="flex min-h-full flex-col items-center justify-center p-8 text-center">
				<div class="mb-4 flex size-20 items-center justify-center rounded-full bg-muted">
					<FileText class="size-8 text-muted-foreground" />
				</div>
				<h3 class="mb-2 text-lg font-medium text-foreground">Preview not available</h3>
				<p class="mb-6 max-w-sm text-sm text-muted-foreground">
					This file type cannot be previewed in the browser. You can download it instead.
				</p>
				<Button onclick={handleDownload}>
					<Download class="size-5" />
					Download File
				</Button>
			</div>
		{/if}
	</div>
</div>
