<script lang="ts">
	import { FILE_CATEGORIES } from '$lib/constants/SchemaData';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, Loader2, Upload, X } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { encryptAndUploadFile } from '$lib/utils/file-upload';
	import { getUserEncryptionKey, getTeamAndAdminEncryptionKeys } from '$lib/utils/crypto';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import initWasm from '$lib/pkg/rust';

	interface Props {
		applicationNumber: string;
		applicationTeam: string | null;
		open: boolean;
		onuploaded: () => void;
		onclose: () => void;
	}

	let {
		applicationNumber,
		applicationTeam,
		open = $bindable(),
		onuploaded,
		onclose
	}: Props = $props();

	let dragging = $state(false);
	let selectedFile = $state<File | null>(null);
	let selectedCategory = $state<(typeof FILE_CATEGORIES)[number]>('Other');
	let error = $state('');
	let loading = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	function reset(): void {
		selectedFile = null;
		selectedCategory = 'Other';
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

	async function handleUpload(): Promise<void> {
		if (!selectedFile) return;

		error = '';
		loading = true;

		try {
			await initWasm();
			const supabase = createBrowserClient();
			const { userId, publicKeyBytes } = await getUserEncryptionKey(supabase);

			const recipients: Array<{ userId: string; publicKeyBytes: Uint8Array }> = [
				{ userId, publicKeyBytes }
			];

			if (applicationTeam) {
				const teamAndAdminKeys = await getTeamAndAdminEncryptionKeys(supabase, applicationTeam);
				for (const recipient of teamAndAdminKeys) {
					if (recipient.userId !== userId) {
						recipients.push(recipient);
					}
				}
			}

			const storagePath = `files/${applicationNumber}`;

			await encryptAndUploadFile({
				supabase,
				file: selectedFile,
				category: selectedCategory,
				storagePath,
				uploaderId: userId,
				recipients,
				applicationNumber
			});

			logAuditEvent({
				details: `[actor] added file "${selectedFile.name}" to application ${applicationNumber}`,
				eventType: 'Added File'
			});

			reset();
			onuploaded();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred during upload.';
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
				Add New File
			</Dialog.Title>
			<Dialog.Description>Upload a new file for this application.</Dialog.Description>
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

			<!-- File Category Select -->
			<div class="space-y-1.5">
				<label for="file-category" class="text-sm font-medium text-foreground">
					File Category
				</label>
				<select
					id="file-category"
					class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
					bind:value={selectedCategory}
					disabled={loading}
				>
					{#each FILE_CATEGORIES as cat (cat)}
						<option value={cat}>{cat}</option>
					{/each}
				</select>
			</div>

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
					Upload File
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
