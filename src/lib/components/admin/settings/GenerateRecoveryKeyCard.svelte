<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { Key, Loader2, ShieldCheck, RefreshCw } from '@lucide/svelte';
	import init, { generate_recovery_key_for_existing } from '$lib/pkg/rust';
	import RecoveryKeyDisplay from '$lib/components/global/RecoveryKeyDisplay.svelte';

	interface Props {
		hasRecoveryKey: boolean;
		userSecret: {
			encrypted_private_key: string;
			pk_salt: string;
			pk_nonce: string;
		} | null;
	}

	let { hasRecoveryKey, userSecret }: Props = $props();

	let masterPassword = $state('');
	let isGenerating = $state(false);
	let errorMessage = $state('');
	let generatedRecoveryKey = $state('');
	let showRecoveryKey = $state(false);
	let showPasswordInput = $state(false);

	function hexToBytes(hex: string): Uint8Array {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
		}
		return bytes;
	}

	async function handleGenerate() {
		errorMessage = '';

		if (!masterPassword || masterPassword.length < 7) {
			errorMessage = 'Enter your password (at least 7 characters).';
			return;
		}

		if (!userSecret) {
			errorMessage = 'No encryption keys found. Please set up your password first.';
			return;
		}

		isGenerating = true;
		try {
			await init();

			const encryptedPk = hexToBytes(userSecret.encrypted_private_key);
			const nonce = hexToBytes(userSecret.pk_nonce);

			const result = generate_recovery_key_for_existing(
				masterPassword,
				userSecret.pk_salt,
				encryptedPk,
				nonce
			);

			if (!result.success) {
				errorMessage = result.error_message || 'Failed to generate recovery key.';
				return;
			}

			// Save the recovery material to the server
			const formData = new FormData();
			formData.set('recovery_encrypted_private_key', result.recovery_encrypted_private_key_hex);
			formData.set('recovery_salt', result.recovery_salt);
			formData.set('recovery_nonce', result.recovery_nonce_hex);

			const response = await fetch('?/generateRecoveryKey', {
				method: 'POST',
				body: formData
			});

			// Check for server errors
			if (response.status >= 400) {
				errorMessage = 'Failed to save recovery key to server. Please try again.';
				return;
			}

			// Show the recovery key
			generatedRecoveryKey = result.recovery_key_hex;
			showRecoveryKey = true;
		} catch (e) {
			errorMessage = `Error: ${e instanceof Error ? e.message : 'Unknown error'}`;
		} finally {
			isGenerating = false;
			masterPassword = '';
		}
	}

	function handleRecoveryAcknowledge() {
		showRecoveryKey = false;
		showPasswordInput = false;
		generatedRecoveryKey = '';
		hasRecoveryKey = true;
	}
</script>

<div class="rounded-lg border border-border bg-card p-6">
	{#if showRecoveryKey}
		<RecoveryKeyDisplay
			recoveryKey={generatedRecoveryKey}
			onAcknowledge={handleRecoveryAcknowledge}
		/>
	{:else}
		<div class="flex items-start gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<Key class="h-5 w-5 text-primary" />
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-foreground">Recovery Key</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					{#if hasRecoveryKey}
						You have a recovery key set up. You can regenerate it if needed.
					{:else}
						Generate a recovery key to recover your account if you forget your password.
					{/if}
				</p>

				{#if hasRecoveryKey}
					<div
						class="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2"
					>
						<ShieldCheck class="h-4 w-4 text-green-600" />
						<span class="text-sm text-green-700">Recovery key is active</span>
					</div>
				{/if}

				{#if showPasswordInput}
					<div class="mt-4 space-y-3">
						<div>
							<label for="recovery_password" class="mb-1 block text-sm font-medium text-gray-700"
								>Password</label
							>
							<Input
								id="recovery_password"
								type="password"
								placeholder="Enter your password"
								bind:value={masterPassword}
								disabled={isGenerating}
							/>
						</div>

						{#if errorMessage}
							<p class="text-sm text-destructive">{errorMessage}</p>
						{/if}

						<div class="flex gap-2">
							<Button onclick={handleGenerate} disabled={isGenerating} size="sm">
								{#if isGenerating}
									<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								{/if}
								{hasRecoveryKey ? 'Regenerate' : 'Generate'}
							</Button>
							<Button
								variant="outline"
								size="sm"
								onclick={() => {
									showPasswordInput = false;
									errorMessage = '';
									masterPassword = '';
								}}
							>
								Cancel
							</Button>
						</div>
					</div>
				{:else}
					<Button
						variant="outline"
						size="sm"
						class="mt-3"
						onclick={() => (showPasswordInput = true)}
					>
						{#if hasRecoveryKey}
							<RefreshCw class="mr-2 h-4 w-4" />
							Regenerate Recovery Key
						{:else}
							<Key class="mr-2 h-4 w-4" />
							Generate Recovery Key
						{/if}
					</Button>
				{/if}
			</div>
		</div>
	{/if}
</div>
