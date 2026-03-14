<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Label } from '$lib/shadcn/components/ui/label/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { enhance } from '$app/forms';
	import initWasm, { encrypt_master_key } from '$lib/pkg/rust';
	import { Loader2, AlertCircle, CheckCircle2 } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';

	let { open }: { open: boolean } = $props();

	let password = $state('');
	let confirmPassword = $state('');
	let isLoading = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');

	let encryptedPrivateKey = $state('');
	let publicKey = $state('');
	let pkSalt = $state('');
	let pkNonce = $state('');

	async function prepareCrypto() {
		errorMessage = '';
		successMessage = '';
		if (password !== confirmPassword) {
			errorMessage = 'Passwords do not match.';
			return false;
		}
		if (password.length < 7) {
			errorMessage = 'Password must be at least 7 characters long.';
			return false;
		}

		isLoading = true;
		try {
			await initWasm();
			const result = encrypt_master_key(password);
			encryptedPrivateKey = result.encrypted_private_key_hex;
			publicKey = result.public_key_hex;
			pkSalt = result.salt;
			pkNonce = result.nonce_hex;
			return true;
		} catch {
			errorMessage = 'Encryption failed. Please try again.';
			isLoading = false;
			return false;
		}
	}

	const submitEnhance: SubmitFunction = async ({ cancel, formData }) => {
		const prepared = await prepareCrypto();
		if (!prepared) {
			cancel();
			return;
		}
		formData.set('encrypted_private_key', encryptedPrivateKey);
		formData.set('public_key', publicKey);
		formData.set('pk_salt', pkSalt);
		formData.set('pk_nonce', pkNonce);
		
		return async ({ update, result }) => {
			isLoading = false;
			if (result.type === 'success') {
				successMessage = 'Master password set successfully!';
			} else if (result.type === 'failure') {
				errorMessage = result.data?.message?.toString() || 'Failed to set master password.';
			}
			update();
		};
	};

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen && !successMessage) {
			// Prevent closing if not succeeded
			return;
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-[425px]">
		<Dialog.Header>
			<Dialog.Title>Set Master Password</Dialog.Title>
			<Dialog.Description>
				Your master password encrypts all your files and generates your client wallet keys. It cannot be recovered if lost. Please keep it safe.
			</Dialog.Description>
		</Dialog.Header>

		<form method="POST" action="/?/setupMasterKey" use:enhance={submitEnhance} class="flex flex-col gap-4">
			<div class="grid w-full items-center gap-1.5">
				<Label for="password">Master Password</Label>
				<Input type="password" id="password" bind:value={password} required />
			</div>
			
			<div class="grid w-full items-center gap-1.5">
				<Label for="confirmPassword">Confirm Password</Label>
				<Input type="password" id="confirmPassword" bind:value={confirmPassword} required disabled={isLoading || !!successMessage} />
			</div>

			{#if errorMessage}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{errorMessage}</p>
				</div>
			{/if}

			{#if successMessage}
				<div class="flex items-start gap-2 rounded-md bg-green-500/10 p-3">
					<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-green-500" />
					<p class="text-sm text-green-500">{successMessage}</p>
				</div>
			{/if}

			<Dialog.Footer>
				<Button type="submit" disabled={isLoading || !!successMessage}>
					{#if isLoading}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Encrypting...
					{:else if successMessage}
						Done
					{:else}
						Save Master Password
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
