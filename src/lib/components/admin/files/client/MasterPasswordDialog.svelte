<script lang="ts">
	import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Label from '$lib/shadcn/components/ui/label/label.svelte';
	import { AlertCircle, Loader2, Lock } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { decryptAndViewFile } from '$lib/utils/file-decrypt';

	interface Props {
		file: FileMetadata | null;
		open: boolean;
		ondecrypted: (fileView: DecryptedFileView) => void;
		onclose: () => void;
	}

	let { file, open = $bindable(), ondecrypted, onclose }: Props = $props();

	let password = $state('');
	let error = $state('');
	let loading = $state(false);

	function reset(): void {
		password = '';
		error = '';
		loading = false;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	async function handleSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();

		if (!file) return;

		if (!password.trim()) {
			error = 'Please enter your master password.';
			return;
		}

		error = '';
		loading = true;

		try {
			const supabase = createBrowserClient();
			const fileView = await decryptAndViewFile({
				supabase,
				file,
				password: password.trim()
			});

			reset();
			ondecrypted(fileView);
		} catch (err) {
			error =
				err instanceof Error ? err.message : 'An unexpected error occurred during decryption.';
		} finally {
			loading = false;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Lock class="size-4" />
				Decrypt File
			</Dialog.Title>
			<Dialog.Description>
				Enter your master password to decrypt
				{#if file}
					<span class="font-medium">{file.file_name}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-2">
				<div class="grid gap-2">
					<Label for="master-password">Master Password</Label>
					<Input
						id="master-password"
						type="password"
						placeholder="Enter your master password"
						bind:value={password}
						disabled={loading}
						autocomplete="off"
					/>
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
				<Button type="submit" disabled={loading}>
					{#if loading}
						<Loader2 class="size-4 animate-spin" />
						Decrypting…
					{:else}
						Decrypt & View
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
