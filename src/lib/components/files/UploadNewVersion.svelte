<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Upload, Loader2, CheckCircle, AlertCircle, X, FileUp } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { hexToBytes } from '$lib/utils/file';
	import initWasm, { encrypt_file } from '$lib/pkg/rust';
	import type { FileMetadata } from '$lib/types/file';

	interface Props {
		open: boolean;
		fileName: string;
		folderPath: string;
		onUploaded: () => void;
	}

	let { open = $bindable(false), fileName, folderPath, onUploaded }: Props = $props();

	let fileInput: HTMLInputElement | null = $state(null);
	let selectedFile: File | null = $state(null);
	let uploading = $state(false);
	let uploadError = $state<string | null>(null);
	let uploadSuccess = $state(false);

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files || target.files.length === 0) return;
		selectedFile = target.files[0];
		uploadError = null;
		uploadSuccess = false;
		target.value = '';
	}

	function removeFile() {
		selectedFile = null;
		uploadError = null;
		uploadSuccess = false;
	}

	function resetState() {
		selectedFile = null;
		uploading = false;
		uploadError = null;
		uploadSuccess = false;
	}

	function handleOpenChange(isOpen: boolean) {
		open = isOpen;
		if (!isOpen) {
			resetState();
		}
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1_048_576).toFixed(1)} MB`;
	}

	async function handleUpload() {
		if (!selectedFile) return;

		uploading = true;
		uploadError = null;

		try {
			const supabase = createBrowserClient();

			await initWasm();

			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) throw new Error('You must be logged in to upload files.');

			// Get user's public key for encryption
			const { data: secret, error: secretError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('public_key')
				.eq('user_id', user.id)
				.single();

			if (secretError || !secret?.public_key) {
				throw new Error('Could not retrieve encryption key. Please set up your master key first.');
			}

			const publicKeyBytes = hexToBytes(secret.public_key);

			// Encrypt the selected file
			const fileBytes = new Uint8Array(await selectedFile.arrayBuffer());
			const result = encrypt_file(fileBytes, publicKeyBytes);

			if (!result.success) {
				throw new Error(`Encryption failed: ${result.error_message}`);
			}

			try {
				const encryptedBlob = new Blob([result.encrypted_data as BlobPart]);

				// Use the selected file's own name (don't rename to old file name)
				const newFileName = selectedFile.name;
				const storageName = `${newFileName}.enc`;
				const filePath = `${folderPath}/${storageName}`;

				// Upload encrypted file to storage (new path, preserves old versions)
				const { data: uploadData, error: uploadErr } = await supabase.storage
					.from('storage')
					.upload(filePath, encryptedBlob, {
						contentType: 'application/octet-stream'
					});

				if (uploadErr) throw new Error(`Upload failed: ${uploadErr.message}`);
				if (!uploadData?.path)
					throw new Error('Upload failed: no confirmation received from storage.');

				// Upload .meta.json sidecar for decryption support
				const metaJson: FileMetadata = {
					original_name: newFileName,
					category: '',
					file_nonce_hex: result.file_nonce_hex,
					encrypted_dek_hex: result.encrypted_dek_hex,
					dek_nonce_hex: result.dek_nonce_hex,
					ephemeral_public_key_hex: result.ephemeral_public_key_hex,
					original_hash_hex: result.original_hash_hex
				};
				const metaBlob = new Blob([JSON.stringify(metaJson)], { type: 'application/json' });
				const metaPath = `${folderPath}/${newFileName}.meta.json`;

				await supabase.storage.from('storage').upload(metaPath, metaBlob, {
					contentType: 'application/json'
				});

				// Insert file_metadata record
				const { data: fileMeta, error: metaErr } = await supabase
					.schema('api')
					.from('file_metadata')
					.insert({
						uploader_id: user.id,
						file_name: newFileName,
						file_path: filePath,
						file_hash: result.original_hash_hex,
						file_nonce: result.file_nonce_hex,
						size: selectedFile.size
					})
					.select('file_id')
					.single();

				if (metaErr || !fileMeta) {
					throw new Error(`Metadata insert failed: ${metaErr?.message}`);
				}

				// Insert file_dek record (leave sequence empty as instructed)
				const { error: dekErr } = await supabase.schema('api').from('file_dek').insert({
					file_id: fileMeta.file_id,
					owner_id: user.id,
					encrypted_dek: result.encrypted_dek_hex,
					dek_nonce: result.dek_nonce_hex,
					ephemeral_public_key: result.ephemeral_public_key_hex
				});

				if (dekErr) {
					throw new Error(`DEK insert failed: ${dekErr.message}`);
				}

				// Look up the previous version's block_id from file_ledger
				// Find other file versions in this folder by matching the base name
				const originalName = fileName.replace(/\.(enc|encrypted)$/, '');
				const baseOriginalName = originalName.replace(/_v\d+(?=\.[^.]+$)/, '');
				const appNumber = folderPath.split('/').pop() ?? '';

				let previousBlockId: string | null = null;

				const { data: existingMeta } = await supabase
					.schema('api')
					.from('file_metadata')
					.select('file_id, file_name')
					.ilike('file_path', `%${appNumber}%`)
					.neq('file_id', fileMeta.file_id);

				const relatedFileIds = (existingMeta ?? [])
					.filter((r) => {
						const rBase = r.file_name.replace(/_v\d+(?=\.[^.]+$)/, '');
						return rBase === baseOriginalName;
					})
					.map((r) => r.file_id);

				if (relatedFileIds.length > 0) {
					// Get the latest ledger entry (highest sequence) among related files
					const { data: prevLedger } = await supabase
						.schema('api')
						.from('file_ledger')
						.select('block_id, sequence')
						.in('file_id', relatedFileIds)
						.order('sequence', { ascending: false })
						.limit(1)
						.single();

					if (prevLedger) {
						previousBlockId = prevLedger.block_id;
					}
				}

				// Determine next sequence number
				const { data: maxSeqRow } = await supabase
					.schema('api')
					.from('file_ledger')
					.select('sequence')
					.order('sequence', { ascending: false })
					.limit(1)
					.single();

				const nextSequence = maxSeqRow ? maxSeqRow.sequence + 1 : 0;

				// Insert ledger entry with previous_block linking to the prior version
				const ledgerInsert: Record<string, unknown> = {
					file_id: fileMeta.file_id,
					sequence: nextSequence
				};
				if (previousBlockId) {
					ledgerInsert.previous_block = previousBlockId;
				}

				const { error: ledgerErr } = await supabase
					.schema('api')
					.from('file_ledger')
					.insert(ledgerInsert);

				if (ledgerErr) {
					throw new Error(`Ledger insert failed: ${ledgerErr.message}`);
				}
			} finally {
				result.free();
			}

			uploadSuccess = true;

			// Notify parent to refresh revision data and file list
			setTimeout(() => {
				onUploaded();
			}, 800);
		} catch (err) {
			uploadError = err instanceof Error ? err.message : 'Upload failed';
		} finally {
			uploading = false;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<FileUp class="size-5 text-primary" />
				Upload New Version
			</Dialog.Title>
			<Dialog.Description>
				Upload a new version of <span class="font-medium">{fileName}</span>. The file will be
				encrypted and a new ledger entry will be created.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-2">
			{#if uploadSuccess}
				<div
					class="flex flex-col items-center gap-2 rounded-lg border border-green-200 bg-green-50 py-8 text-center dark:border-green-900 dark:bg-green-950"
				>
					<CheckCircle class="size-8 text-green-600 dark:text-green-400" />
					<p class="text-sm font-medium text-green-700 dark:text-green-300">
						New version uploaded successfully!
					</p>
				</div>
			{:else if uploadError}
				<div
					class="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
				>
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{uploadError}</p>
				</div>
			{/if}

			{#if !uploadSuccess}
				{#if selectedFile}
					<div class="flex items-center gap-3 rounded-md border px-4 py-3">
						<div class="min-w-0 flex-1">
							<p class="truncate text-sm font-medium">{selectedFile.name}</p>
							<p class="text-xs text-muted-foreground">{formatSize(selectedFile.size)}</p>
						</div>
						<Button
							variant="ghost"
							size="icon-sm"
							class="shrink-0 text-muted-foreground hover:text-destructive"
							onclick={removeFile}
							disabled={uploading}
						>
							<X class="size-4" />
						</Button>
					</div>
				{:else}
					<button
						type="button"
						class="flex w-full cursor-pointer flex-col items-center gap-2 rounded-md border border-dashed border-muted-foreground/25 py-10 text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
						onclick={() => fileInput?.click()}
					>
						<Upload class="size-8 opacity-50" />
						<p class="text-sm">Click to choose a file</p>
					</button>
				{/if}

				<input bind:this={fileInput} type="file" class="hidden" onchange={handleFileSelect} />
			{/if}
		</div>

		{#if !uploadSuccess}
			<Dialog.Footer>
				<Button variant="outline" onclick={() => handleOpenChange(false)} disabled={uploading}>
					Cancel
				</Button>
				<Button onclick={handleUpload} disabled={!selectedFile || uploading} class="gap-2">
					{#if uploading}
						<Loader2 class="size-4 animate-spin" />
						Uploading…
					{:else}
						<Upload class="size-4" />
						Upload
					{/if}
				</Button>
			</Dialog.Footer>
		{/if}
	</Dialog.Content>
</Dialog.Root>
