<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { superForm } from 'sveltekit-superforms';
	import { untrack } from 'svelte';
	import initWasm, { encrypt_master_key_with_recovery } from '$lib/pkg/rust';
	import { Loader2, AlertCircle, ShieldCheck } from '@lucide/svelte';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { enhance } from '$app/forms';
	import RecoveryKeyDisplay from '$lib/components/global/RecoveryKeyDisplay.svelte';

	let { data } = $props();

	const { form, errors, submitting, message } = superForm(
		untrack(() => data.form),
		{
			onResult: ({ result }) => {
				if (result.type === 'redirect') {
					// Redirect handled by SvelteKit
				}
			}
		}
	);

	let confirmPassword = $state('');
	let isEncrypting = $state(false);
	let encryptionError = $state('');
	let passwordMismatch = $derived(confirmPassword.length > 0 && $form.password !== confirmPassword);

	// Recovery key display state
	let generatedRecoveryKey = $state('');
	let showRecoveryKey = $state(false);
	let pendingFormData = $state<FormData | null>(null);

	/**
	 * Extracts the first error message from a superforms error field.
	 */
	function getError(field: unknown): string | undefined {
		if (!field) return undefined;
		if (Array.isArray(field) && field.length > 0) return String(field[0]);
		if (typeof field === 'object' && field !== null && '_errors' in field) {
			const errs = (field as { _errors?: string[] })._errors;
			if (errs && errs.length > 0) return errs[0];
		}
		return undefined;
	}

	const submitEnhance: SubmitFunction = async ({ cancel, formData }) => {
		encryptionError = '';

		// Client-side validation
		if ($form.password.length < 7) {
			encryptionError = 'Password must be at least 7 characters long.';
			cancel();
			return;
		}

		if ($form.password !== confirmPassword) {
			encryptionError = 'Passwords do not match.';
			cancel();
			return;
		}

		// Generate master key using WASM
		isEncrypting = true;
		try {
			await initWasm();
			const result = encrypt_master_key_with_recovery($form.password);

			formData.set('encrypted_private_key', result.encrypted_private_key_hex);
			formData.set('public_key', result.public_key_hex);
			formData.set('pk_salt', result.salt);
			formData.set('pk_nonce', result.nonce_hex);
			formData.set('recovery_encrypted_private_key', result.recovery_encrypted_private_key_hex);
			formData.set('recovery_salt', result.recovery_salt);
			formData.set('recovery_nonce', result.recovery_nonce_hex);

			// Show recovery key before submitting
			generatedRecoveryKey = result.recovery_key_hex;
			pendingFormData = formData;
			showRecoveryKey = true;
			isEncrypting = false;
			cancel();
			return;
		} catch (err) {
			console.error('Encryption failed:', err);
			encryptionError = 'Failed to generate encryption keys. Please try again.';
			isEncrypting = false;
			cancel();
			return;
		}
	};
	async function submitPendingForm() {
		if (!pendingFormData) return;

		isEncrypting = true;
		try {
			const response = await fetch('?/setupAccount', {
				method: 'POST',
				body: pendingFormData
			});

			if (response.redirected) {
				window.location.href = response.url;
			} else {
				// Force navigation to dashboard after setup
				window.location.href = '/dashboard';
			}
		} catch (err) {
			console.error('Submission failed:', err);
			encryptionError = 'Failed to complete setup. Please try again.';
		} finally {
			isEncrypting = false;
		}
	}
</script>

{#if showRecoveryKey}
	<div class="mx-auto w-full max-w-sm">
		<RecoveryKeyDisplay
			recoveryKey={generatedRecoveryKey}
			onAcknowledge={submitPendingForm}
			title="Save Your Recovery Key"
			description="This key allows you to recover your account if you forget your password. Save it in a secure location."
		/>
	</div>
{:else}
	<div class="mx-auto w-full max-w-sm">
		<div class="mb-6">
			<div class="mb-2 flex items-center gap-2">
				<ShieldCheck class="size-6 text-primary" />
				<h3 class="font-bold text-primary">Set Up Your Account</h3>
			</div>
			<p class="text-sm text-muted-foreground">
				Choose a password to secure your account. This will also generate your encryption keys for
				file security.
			</p>
		</div>

		{#if $message}
			<div class="mb-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 p-3">
				<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
				<p class="text-sm text-destructive">{$message}</p>
			</div>
		{/if}

		{#if encryptionError}
			<div class="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3">
				<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
				<p class="text-sm text-destructive">{encryptionError}</p>
			</div>
		{/if}

		<form
			method="POST"
			action="?/setupAccount"
			use:enhance={submitEnhance}
			class="flex flex-col gap-4"
		>
			<input type="hidden" name="encrypted_private_key" value="" />
			<input type="hidden" name="public_key" value="" />
			<input type="hidden" name="pk_salt" value="" />
			<input type="hidden" name="pk_nonce" value="" />
			<input type="hidden" name="recovery_encrypted_private_key" value="" />
			<input type="hidden" name="recovery_salt" value="" />
			<input type="hidden" name="recovery_nonce" value="" />

			<div class="space-y-2">
				<label for="password" class="text-sm leading-none font-medium text-foreground">
					Password
				</label>
				<Input
					type="password"
					name="password"
					id="password"
					bind:value={$form.password}
					placeholder="Min. 7 characters"
					disabled={isEncrypting || $submitting}
				/>
				{#if getError($errors.password)}
					<span class="text-xs text-destructive">{getError($errors.password)}</span>
				{/if}
			</div>

			<div class="space-y-2">
				<label for="confirmPassword" class="text-sm leading-none font-medium text-foreground">
					Confirm Password
				</label>
				<Input
					type="password"
					id="confirmPassword"
					bind:value={confirmPassword}
					placeholder="Re-enter your password"
					disabled={isEncrypting || $submitting}
				/>
				{#if passwordMismatch}
					<span class="text-xs text-destructive">Passwords do not match</span>
				{/if}
			</div>

			<div class="rounded-md bg-muted/50 p-3">
				<p class="text-xs text-muted-foreground">
					<strong>Important:</strong> Your password is used to generate encryption keys that protect your
					files. Keep it safe — it cannot be recovered if lost.
				</p>
			</div>

			<Button
				type="submit"
				disabled={isEncrypting ||
					$submitting ||
					passwordMismatch ||
					!$form.password ||
					!confirmPassword}
				class="w-full"
				size="lg"
			>
				{#if isEncrypting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Generating encryption keys...
				{:else if $submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Setting up account...
				{:else}
					Complete Setup
				{/if}
			</Button>
		</form>
	</div>
{/if}
