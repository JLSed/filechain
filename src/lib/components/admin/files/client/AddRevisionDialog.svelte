<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, Loader2, Upload, X } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { uploadFileRevision } from '$lib/utils/file-revision';
	import { getUserEncryptionKey } from '$lib/utils/crypto';
	import initWasm from '$lib/pkg/rust';

	interface Props {
		file: FileMetadata | null;
		open: boolean;
		onuploaded: () => void;
		onclose: () => void;
	}

	let { file, open = $bindable(), onuploaded, onclose }: Props = $props();

	let dragging = $state(false);
	let selectedFile = $state<File | null>(null);
	let error = $state('');
	let loading = $state(false);

	function reset(): void {
		selectedFile = null;
		error = '';
		loading = false;
		dragging = false;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	function setFile(fileList: FileList): void {
		if (fileList.length > 0) {
			selectedFile = fileList[0];
			error = '';
		}
	}

	function handleDrop(e: DragEvent): void {
		dragging = false;
		if (e.dataTransfer?.files?.length) {
			setFile(e.dataTransfer.files);
		}
	}

	function handleFileInput(e: Event): void {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) {
			setFile(input.files);
			input.value = '';
		}
	}

	function removeFile(): void {
		selectedFile = null;
	}

	let fileInput: HTMLInputElement | undefined = $state();

	async function handleUpload(): Promise<void> {
		if (!file || !selectedFile) return;

		error = '';
		loading = true;

		try {
			await initWasm();
			const supabase = createBrowserClient();
			const { userId, publicKeyBytes } = await getUserEncryptionKey(supabase);

			await uploadFileRevision({
				supabase,
				originalFile: file,
				newFile: selectedFile,
				uploaderId: userId,
				publicKeyBytes
			});

			reset();
			onuploaded();
		} catch (err) {
			error =
				err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Upload class="size-4" />
				Add Revision
			</Dialog.Title>
			<Dialog.Description>
				Upload a new version of
				{#if file}
					<span class="font-medium">{file.file_name}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-2">
			{#if selectedFile}
				<div
					class="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
				>
					<span class="min-w-0 flex-1 truncate text-sm text-foreground">
						{selectedFile.name}
					</span>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						onclick={removeFile}
						disabled={loading}
						class="size-7 shrink-0"
					>
						<X class="size-4" />
					</Button>
				</div>
			{:else}
				<div
					class="flex min-h-36 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors {dragging
						? 'border-primary bg-primary/5'
						: 'border-muted-foreground/30 hover:border-muted-foreground/50'}"
					ondragover={(e) => {
						e.preventDefault();
						dragging = true;
					}}
					ondragleave={() => (dragging = false)}
					ondrop={(e) => {
						e.preventDefault();
						handleDrop(e);
					}}
					onclick={() => fileInput?.click()}
					onkeydown={(e) => {
						if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
					}}
					role="button"
					tabindex="0"
				>
					<div class="text-center">
						<svg
							class="mx-auto mb-2 h-8 w-8 text-muted-foreground/50"
							xmlns="http://www.w3.org/2000/svg"
							fill="none"
							viewBox="0 0 24 24"
							stroke-width="1.5"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
							/>
						</svg>
						<p class="text-sm font-medium text-muted-foreground">
							{dragging ? 'Drop file here' : 'Drag & drop a file or click to browse'}
						</p>
					</div>
				</div>
			{/if}

			<input bind:this={fileInput} type="file" class="hidden" onchange={handleFileInput} />

			{#if error}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{error}</p>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Dialog.Close type="button" disabled={loading}>Cancel</Dialog.Close>
			<Button type="button" disabled={loading || !selectedFile} onclick={handleUpload}>
				{#if loading}
					<Loader2 class="size-4 animate-spin" />
					Uploading…
				{:else}
					Upload Revision
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
