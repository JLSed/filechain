<script lang="ts">
	import { Lock, Loader2, AlertCircle } from '@lucide/svelte';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import type {
		FileMetadata,
		UserSecrets,
		DecryptionStep,
		DecryptedFileView
	} from '$lib/types/file';
	import { DECRYPTION_STEP_LABELS } from '$lib/types/file';
	import { hexToBytes, getMimeType, stripEncExtension } from '$lib/utils/file';
	import { createBrowserClient } from '$lib/services/supabase/client';

	interface Props {
		/** The encrypted file name (e.g. "document.pdf.enc") */
		fileName: string;
		/** The storage folder path (e.g. "files/202500001") */
		folderPath: string;
		/** Whether the dialog is open */
		open: boolean;
		/** Called when the dialog should close */
		onclose: () => void;
		/** Called when decryption succeeds, passing the decrypted file view */
		onDecrypted: (view: DecryptedFileView) => void;
	}

	let { fileName, folderPath, open = $bindable(false), onclose, onDecrypted }: Props = $props();

	let password = $state('');
	let step = $state<DecryptionStep>('idle');
	let errorMessage = $state('');

	const isLoading = $derived(step !== 'idle' && step !== 'done' && step !== 'error');
	const originalName = $derived(stripEncExtension(fileName));

	function resetState(): void {
		password = '';
		step = 'idle';
		errorMessage = '';
	}

	function handleClose(): void {
		resetState();
		onclose();
	}

	async function handleDecrypt(): Promise<void> {
		if (!password.trim()) return;
		errorMessage = '';

		try {
			const supabase = createBrowserClient();

			// Verify authentication
			const {
				data: { user }
			} = await supabase.auth.getUser();
			if (!user) throw new Error('Not authenticated');

			// Step 1: Fetch the .meta.json sidecar file
			step = 'fetching-meta';
			const metaFileName = `${stripEncExtension(fileName)}.meta.json`;
			const metaPath = `${folderPath}/${metaFileName}`;

			const { data: metaBlob, error: metaError } = await supabase.storage
				.from('storage')
				.download(metaPath);
			if (metaError || !metaBlob) {
				throw new Error(metaError?.message ?? 'Failed to download file metadata');
			}
			const meta: FileMetadata = JSON.parse(await metaBlob.text());

			// Step 2: Fetch user's encryption secrets
			step = 'fetching-secrets';
			const { data: secrets, error: secretsError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('encrypted_private_key, public_key, pk_salt, pk_nonce')
				.eq('user_id', user.id)
				.single();
			if (secretsError || !secrets) {
				throw new Error(secretsError?.message ?? 'Failed to fetch user secrets');
			}
			const userSecrets = secrets as UserSecrets;

			// Step 3: Download the encrypted file
			step = 'downloading-file';
			const encPath = `${folderPath}/${fileName}`;
			const { data: fileBlob, error: downloadError } = await supabase.storage
				.from('storage')
				.download(encPath);
			if (downloadError || !fileBlob) {
				throw new Error(downloadError?.message ?? 'Failed to download encrypted file');
			}
			const encryptedData = new Uint8Array(await fileBlob.arrayBuffer());

			// Step 4: Decrypt via WASM
			step = 'decrypting';
			const wasm = await import('$lib/pkg/rust');
			await wasm.default();

			const result = wasm.decrypt_file({
				encrypted_data: encryptedData,
				password,
				pk_salt: userSecrets.pk_salt,
				encrypted_private_key: hexToBytes(userSecrets.encrypted_private_key),
				pk_nonce: hexToBytes(userSecrets.pk_nonce),
				ephemeral_public_key: hexToBytes(meta.ephemeral_public_key_hex),
				encrypted_dek: hexToBytes(meta.encrypted_dek_hex),
				dek_nonce: hexToBytes(meta.dek_nonce_hex),
				file_nonce: hexToBytes(meta.file_nonce_hex)
			});

			if (!result.success) {
				throw new Error(result.error_message || 'Decryption failed. Check your password.');
			}

			// Build decrypted file view
			const dataCopy = new Uint8Array(result.decrypted_data);
			const mimeType = getMimeType(originalName);
			const blob = new Blob([dataCopy.buffer as ArrayBuffer], { type: mimeType });
			const blobUrl = URL.createObjectURL(blob);

			result.free();

			step = 'done';
			resetState();
			onDecrypted({
				fileName: originalName,
				mimeType,
				blobUrl,
				data: dataCopy
			});
		} catch (err) {
			console.error('[FileDecryptionDialog] Decryption error:', err);
			errorMessage = err instanceof Error ? err.message : String(err);
			step = 'error';
		}
	}

	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && password.trim() && !isLoading) {
			handleDecrypt();
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<div class="flex items-center gap-3">
				<Lock class="size-5 text-primary" />
				<Dialog.Title>View Encrypted File</Dialog.Title>
			</div>
			<Dialog.Description class="sr-only">
				Enter your master password to decrypt and view this file.
			</Dialog.Description>
		</Dialog.Header>

		<!-- File info -->
		<div class="rounded-lg bg-muted p-4">
			<p class="truncate text-sm font-medium text-foreground">
				{originalName}
			</p>
		</div>

		<!-- Error display -->
		{#if step === 'error' && errorMessage}
			<div
				class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
			>
				<AlertCircle class="mt-0.5 size-5 shrink-0 text-destructive" />
				<div>
					<p class="text-sm font-medium text-destructive">Decryption failed</p>
					<p class="mt-1 text-xs text-destructive/80">{errorMessage}</p>
				</div>
			</div>
		{/if}

		<!-- Loading state -->
		{#if isLoading}
			<div class="flex items-center justify-center gap-3 py-8 text-center">
				<Loader2 class="size-6 shrink-0 animate-spin text-primary" />
				<p class="text-sm font-medium text-foreground">{DECRYPTION_STEP_LABELS[step]}</p>
			</div>
		{/if}

		<!-- Password input -->
		{#if !isLoading}
			<div class="space-y-2">
				<label for="decrypt-password" class="text-sm font-medium text-foreground">
					Enter your master password to view this file
				</label>
				<Input
					id="decrypt-password"
					type="password"
					bind:value={password}
					onkeydown={handleKeydown}
					placeholder="Master password"
					disabled={isLoading}
				/>
			</div>
		{/if}

		<Dialog.Footer>
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>Cancel</Button>
			<Button onclick={handleDecrypt} disabled={isLoading || !password.trim()}>
				{#if isLoading}
					<Loader2 class="size-4 animate-spin" />
					Decrypting…
				{:else if step === 'error'}
					Retry
				{:else}
					View File
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
