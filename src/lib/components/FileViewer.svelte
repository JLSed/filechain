<script lang="ts">
	import { FileText } from 'lucide-svelte';
	import type { FileMetadata } from '$lib/types/file';
	import { formatDate } from '$lib/utils/format';
	import FileDecryptionModal from './FileDecryptionModal.svelte';

	interface Props {
		files: FileMetadata[];
	}

	let { files }: Props = $props();

	let selectedFile = $state<FileMetadata | null>(null);
	let modalOpen = $state(false);

	function selectFile(file: FileMetadata): void {
		selectedFile = file;
		modalOpen = true;
	}

	function closeModal(): void {
		modalOpen = false;
		selectedFile = null;
	}
</script>

{#if files.length === 0}
	<div class="rounded-xl border border-border bg-background p-12">
		<div class="flex flex-col items-center justify-center text-center">
			<div class="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
				<FileText size={28} class="text-muted-foreground" />
			</div>
			<h3 class="mb-1 text-lg font-medium text-foreground">No files yet</h3>
			<p class="max-w-sm text-sm text-muted-foreground">
				Upload your first file to get started. All files are encrypted client-side before upload.
			</p>
		</div>
	</div>
{:else}
	<div>
		<!-- Header -->
		<div class="border-b border-border py-4">
			<h1 class="font-semibold text-foreground">Files</h1>
		</div>

		<!-- File list -->
		<div class="flex flex-col gap-2">
			{#each files as file (file.file_id)}
				{@const date = formatDate(file.uploaded_at)}
				<button
					type="button"
					onclick={() => selectFile(file)}
					class="group flex w-full cursor-pointer items-center rounded-md bg-primary/5 px-4 py-4 text-foreground transition-colors hover:bg-primary/10"
				>
					<!-- File icon -->
					<div class="flex h-10 w-10 shrink-0 items-center justify-center">
						<FileText size={20} />
					</div>

					<!-- File name -->
					<div class="ml-2 min-w-0 flex-1 text-left">
						<p class="truncate text-sm font-medium">{file.file_name}</p>
					</div>

					<!-- Placeholder for size -->
					<div class="mr-6 hidden w-24 text-right sm:block">
						<span class="text-sm text-muted-foreground">—</span>
					</div>

					<!-- Upload date -->
					<div class="w-32 shrink-0 text-right">
						<span class="text-sm text-muted-foreground">{date}</span>
					</div>
				</button>
			{/each}
		</div>
	</div>
{/if}

<!-- Decryption modal -->
{#if selectedFile}
	<FileDecryptionModal file={selectedFile} bind:open={modalOpen} onclose={closeModal} />
{/if}
