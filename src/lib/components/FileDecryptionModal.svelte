<script lang="ts">
	import { Lock, Loader2, AlertCircle, Download, Eye, FileText } from 'lucide-svelte';
	import * as Dialog from '$lib/components/shadcn/ui/dialog/index.js';
	import { Button } from '$lib/components/shadcn/ui/button/index.js';
	import { Input } from '$lib/components/shadcn/ui/input/index.js';
	import type { FileMetadata, FileDek, UserSecrets, DecryptionStep } from '$lib/types/file';
	import { STEP_LABELS } from '$lib/types/file';
	import { hexToUint8Array } from '$lib/utils/hex';
	import { formatDate } from '$lib/utils/format';
	import { getMimeType, isPdf, isImage, isText, getDisplayName } from '$lib/utils/mime';
	import { extractStoragePath } from '$lib/utils/storage';
	import { createBrowserClient } from '$lib/services/supabase/client';

	interface Props {
		file: FileMetadata;
		open: boolean;
		onclose: () => void;
	}

	let { file, open = $bindable(false), onclose }: Props = $props();

	let password = $state('');
	let step = $state<DecryptionStep>('idle');
	let errorMessage = $state('');
	let decryptedData = $state<Uint8Array | null>(null);
	let decryptedBlobUrl = $state<string | null>(null);

	const isLoading = $derived(step !== 'idle' && step !== 'done' && step !== 'error');
	const mimeType = $derived(getMimeType(file.file_name));
	const displayName = $derived(getDisplayName(file.file_name));

	/**
	 * Resets modal state to initial values.
	 */
	function resetState(): void {
		password = '';
		step = 'idle';
		errorMessage = '';
		if (decryptedBlobUrl) {
			URL.revokeObjectURL(decryptedBlobUrl);
		}
		decryptedData = null;
		decryptedBlobUrl = null;
	}

	/**
	 * Handles closing the modal and cleaning up state.
	 */
	function handleClose(): void {
		resetState();
		onclose();
	}

	/**
	 * Fetches the file DEK for the current user from the database.
	 */
	async function fetchFileDek(
		supabase: ReturnType<typeof createBrowserClient>,
		fileId: string,
		userId: string
	): Promise<FileDek> {
		const { data, error } = await supabase
			.schema('api')
			.from('file_dek')
			.select(
				'key_id, file_id, owner_id, encrypted_dek, dek_nonce, ephemeral_public_key, created_at'
			)
			.eq('file_id', fileId)
			.eq('owner_id', userId)
			.single();

		if (error || !data) {
			throw new Error(error?.message ?? 'Failed to fetch file encryption key');
		}
		return data as FileDek;
	}

	/**
	 * Fetches the current user's secrets needed for decryption.
	 */
	async function fetchUserSecrets(
		supabase: ReturnType<typeof createBrowserClient>,
		userId: string
	): Promise<UserSecrets> {
		const { data, error } = await supabase
			.schema('api')
			.from('user_secrets')
			.select('encrypted_private_key, public_key, pk_salt, pk_nonce')
			.eq('user_id', userId)
			.single();

		if (error || !data) {
			throw new Error(error?.message ?? 'Failed to fetch user secrets');
		}
		return data as UserSecrets;
	}

	/**
	 * Runs the full decryption pipeline:
	 * 1. Fetch DEK + user secrets
	 * 2. Download encrypted file from Supabase storage
	 * 3. Decrypt via WASM (X25519 + AES-256-GCM)
	 * 4. Create blob URL for viewing
	 */
	async function handleDecrypt(): Promise<void> {
		if (!password.trim()) return;
		errorMessage = '';

		try {
			const supabase = createBrowserClient();

			// Verify authentication
			const {
				data: { user }
			} = await supabase.auth.getUser();

			if (!user) {
				throw new Error('Not authenticated');
			}

			// Step 1: Fetch DEK and user secrets in parallel
			step = 'fetching-keys';

			const [dek, secrets] = await Promise.all([
				fetchFileDek(supabase, file.file_id, user.id),
				fetchUserSecrets(supabase, user.id)
			]);

			// Step 2: Download encrypted file from storage
			step = 'downloading-file';

			const storagePath = extractStoragePath(file.file_path);
			const { data: fileBlob, error: downloadError } = await supabase.storage
				.from('storage')
				.download(storagePath);

			if (downloadError || !fileBlob) {
				throw new Error(downloadError?.message ?? 'Failed to download encrypted file');
			}

			const encryptedData = new Uint8Array(await fileBlob.arrayBuffer());

			// Step 3: Decrypt file key
			step = 'decrypting-key';

			const encryptedPrivateKeyBytes = hexToUint8Array(secrets.encrypted_private_key);
			const pkNonceBytes = hexToUint8Array(secrets.pk_nonce);
			const ephemeralPublicKeyBytes = hexToUint8Array(dek.ephemeral_public_key);
			const encryptedDekBytes = hexToUint8Array(dek.encrypted_dek);
			const dekNonceBytes = hexToUint8Array(dek.dek_nonce);
			const fileNonceBytes = hexToUint8Array(file.file_nonce);

			// Step 4: Decrypt file content via WASM
			step = 'decrypting-file';

			const wasm = await import('$lib/pkg/rust');
			await wasm.default();

			const decryptResult = wasm.decrypt_file({
				encrypted_data: encryptedData,
				password,
				pk_salt: secrets.pk_salt,
				encrypted_private_key: encryptedPrivateKeyBytes,
				pk_nonce: pkNonceBytes,
				ephemeral_public_key: ephemeralPublicKeyBytes,
				encrypted_dek: encryptedDekBytes,
				dek_nonce: dekNonceBytes,
				file_nonce: fileNonceBytes
			});

			if (!decryptResult.success) {
				throw new Error(decryptResult.error_message || 'Decryption failed. Check your password.');
			}

			// Create blob URL for viewing
			const dataCopy = new Uint8Array(decryptResult.decrypted_data);
			decryptedData = dataCopy;

			const blob = new Blob([dataCopy.buffer as ArrayBuffer], { type: mimeType });
			decryptedBlobUrl = URL.createObjectURL(blob);

			step = 'done';
		} catch (err) {
			console.error('[FileDecryptionModal] Decryption error:', err);
			errorMessage = err instanceof Error ? err.message : String(err);
			step = 'error';
		}
	}

	/**
	 * Downloads the decrypted file to the user's device.
	 */
	function handleDownload(): void {
		if (!decryptedData) return;

		const blob = new Blob([decryptedData.buffer as ArrayBuffer], { type: mimeType });
		const url = URL.createObjectURL(blob);
		const anchor = document.createElement('a');
		anchor.href = url;
		anchor.download = displayName;
		document.body.appendChild(anchor);
		anchor.click();
		document.body.removeChild(anchor);
		URL.revokeObjectURL(url);
	}

	/**
	 * Handles keyboard shortcut for decryption.
	 */
	function handleKeydown(event: KeyboardEvent): void {
		if (event.key === 'Enter' && password.trim() && !isLoading) {
			handleDecrypt();
		}
	}
</script>

<!-- File content viewer (fullscreen overlay after decryption) -->
{#if step === 'done' && decryptedBlobUrl}
	<div class="fixed inset-0 z-50 flex flex-col bg-black/60 backdrop-blur-sm">
		<!-- Top bar -->
		<div
			class="flex items-center justify-between border-b border-border bg-background px-6 py-4 shadow-sm"
		>
			<div class="flex min-w-0 items-center gap-3">
				<Eye size={20} class="shrink-0 text-primary" />
				<h2 class="truncate text-base font-semibold text-foreground">
					{displayName}
				</h2>
			</div>
			<div class="flex shrink-0 items-center gap-2">
				<Button variant="default" size="sm" onclick={handleDownload}>
					<Download size={16} />
					Download
				</Button>
				<Button variant="outline" size="sm" onclick={handleClose}>Close</Button>
			</div>
		</div>

		<!-- Content area -->
		<div class="flex-1 overflow-auto bg-muted">
			{#if isPdf(mimeType)}
				<iframe src={decryptedBlobUrl} class="h-full w-full" title={displayName}></iframe>
			{:else if isImage(mimeType)}
				<div class="flex min-h-full items-center justify-center p-8">
					<img
						src={decryptedBlobUrl}
						alt={displayName}
						class="max-h-full max-w-full rounded-lg object-contain shadow-lg"
					/>
				</div>
			{:else if isText(mimeType)}
				{#await fetch(decryptedBlobUrl).then((r) => r.text())}
					<div class="flex min-h-full items-center justify-center p-8">
						<p class="text-sm text-muted-foreground">Loading...</p>
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
					<div class="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-muted">
						<FileText size={32} class="text-muted-foreground" />
					</div>
					<h3 class="mb-2 text-lg font-medium text-foreground">Preview not available</h3>
					<p class="mb-6 max-w-sm text-sm text-muted-foreground">
						This file type cannot be previewed in the browser. You can download it instead.
					</p>
					<Button onclick={handleDownload}>
						<Download size={18} />
						Download File
					</Button>
				</div>
			{/if}
		</div>
	</div>
{:else}
	<!-- Password prompt / loading / error dialog -->
	<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && handleClose()}>
		<Dialog.Content class="sm:max-w-md" showCloseButton={!isLoading}>
			<Dialog.Header>
				<div class="flex items-center gap-3">
					<Lock size={20} class="text-primary" />
					<Dialog.Title>View Encrypted File</Dialog.Title>
				</div>
				<Dialog.Description class="sr-only">
					Enter your master password to decrypt and view this file.
				</Dialog.Description>
			</Dialog.Header>

			<!-- File info -->
			<div class="rounded-lg bg-muted p-4">
				<p class="truncate text-sm font-medium text-foreground">
					{file.file_name}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					Uploaded {formatDate(file.uploaded_at)}
				</p>
			</div>

			<!-- Error display -->
			{#if step === 'error' && errorMessage}
				<div
					class="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4"
				>
					<AlertCircle size={20} class="mt-0.5 shrink-0 text-destructive" />
					<div>
						<p class="text-sm font-medium text-destructive">Decryption failed</p>
						<p class="mt-1 text-xs text-destructive/80">{errorMessage}</p>
					</div>
				</div>
			{/if}

			<!-- Loading state -->
			{#if isLoading}
				<div class="flex items-center justify-center gap-3 py-8 text-center">
					<Loader2 size={24} class="shrink-0 animate-spin text-primary" />
					<p class="text-sm font-medium text-foreground">{STEP_LABELS[step]}</p>
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
						<Loader2 size={16} class="animate-spin" />
						Decrypting...
					{:else if step === 'error'}
						Retry
					{:else}
						View File
					{/if}
				</Button>
			</Dialog.Footer>
		</Dialog.Content>
	</Dialog.Root>
{/if}
