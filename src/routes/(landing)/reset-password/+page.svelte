<script lang="ts">
	import { untrack } from 'svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ArrowLeft, Key, Loader2, ShieldCheck, AlertTriangle } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import init, {
		encrypt_master_key_with_recovery,
		recover_and_reencrypt_private_key
	} from '$lib/pkg/rust';
	import RecoveryKeyDisplay from '$lib/components/global/RecoveryKeyDisplay.svelte';

	let { data }: PageProps = $props();

	// Tab state
	let activeTab = $state<'fresh' | 'recovery'>(
		untrack(() => data.hasRecoveryKey) ? 'recovery' : 'fresh'
	);

	// Fresh reset form
	let newPassword = $state('');
	let confirmPassword = $state('');
	let freshError = $state('');
	let freshLoading = $state(false);

	// Recovery key form
	let recoveryKey = $state('');
	let recoveryNewPassword = $state('');
	let recoveryConfirmPassword = $state('');
	let recoveryError = $state('');
	let recoveryLoading = $state(false);

	// Recovery key display after successful operations
	let generatedRecoveryKey = $state('');
	let showRecoveryKey = $state(false);
	let pendingFormData = $state<FormData | null>(null);
	let pendingAction = $state('');
	let submitting = $state(false);

	const { enhance: freshEnhance } = superForm(
		untrack(() => data.resetForm),
		{
			onSubmit: async ({ cancel }) => {
				cancel();
				await handleFreshReset();
			}
		}
	);

	const { enhance: recoveryEnhance } = superForm(
		untrack(() => data.recoverForm),
		{
			onSubmit: async ({ cancel }) => {
				cancel();
				await handleRecoveryReset();
			}
		}
	);

	function hexToBytes(hex: string): Uint8Array {
		const bytes = new Uint8Array(hex.length / 2);
		for (let i = 0; i < hex.length; i += 2) {
			bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
		}
		return bytes;
	}

	async function handleFreshReset() {
		freshError = '';

		if (newPassword.length < 7) {
			freshError = 'Password must be at least 7 characters.';
			return;
		}
		if (newPassword !== confirmPassword) {
			freshError = 'Passwords do not match.';
			return;
		}

		freshLoading = true;
		try {
			await init();
			const result = encrypt_master_key_with_recovery(newPassword);

			generatedRecoveryKey = result.recovery_key_hex;
			showRecoveryKey = true;

			// Prepare form data for submission after user acknowledges recovery key
			const formData = new FormData();
			formData.set('new_password', newPassword);
			formData.set('encrypted_private_key', result.encrypted_private_key_hex);
			formData.set('public_key', result.public_key_hex);
			formData.set('pk_salt', result.salt);
			formData.set('pk_nonce', result.nonce_hex);
			formData.set('recovery_encrypted_private_key', result.recovery_encrypted_private_key_hex);
			formData.set('recovery_salt', result.recovery_salt);
			formData.set('recovery_nonce', result.recovery_nonce_hex);
			pendingFormData = formData;
			pendingAction = '?/resetFresh';
		} catch (e) {
			freshError = `Encryption failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
		} finally {
			freshLoading = false;
		}
	}

	async function handleRecoveryReset() {
		recoveryError = '';

		if (recoveryNewPassword.length < 7) {
			recoveryError = 'Password must be at least 7 characters.';
			return;
		}
		if (recoveryNewPassword !== recoveryConfirmPassword) {
			recoveryError = 'Passwords do not match.';
			return;
		}
		if (!recoveryKey.trim()) {
			recoveryError = 'Recovery key is required.';
			return;
		}

		recoveryLoading = true;
		try {
			await init();

			const recoveryData = data.recoveryData;
			if (!recoveryData) {
				recoveryError = 'No recovery key data found. Use the fresh reset option.';
				return;
			}

			const recoveryEncryptedPk = hexToBytes(recoveryData.recovery_encrypted_private_key);
			const recoveryNonce = hexToBytes(recoveryData.recovery_nonce);

			const result = recover_and_reencrypt_private_key(
				recoveryKey.trim(),
				recoveryData.recovery_salt,
				recoveryEncryptedPk,
				recoveryNonce,
				recoveryNewPassword
			);

			if (!result.success) {
				recoveryError = result.error_message || 'Recovery failed. Check your recovery key.';
				return;
			}

			generatedRecoveryKey = result.new_recovery_key_hex;
			showRecoveryKey = true;

			const formData = new FormData();
			formData.set('recovery_key', recoveryKey);
			formData.set('new_password', recoveryNewPassword);
			formData.set('encrypted_private_key', result.encrypted_private_key_hex);
			formData.set('pk_salt', result.salt);
			formData.set('pk_nonce', result.nonce_hex);
			formData.set('recovery_encrypted_private_key', result.recovery_encrypted_private_key_hex);
			formData.set('recovery_salt', result.recovery_salt);
			formData.set('recovery_nonce', result.recovery_nonce_hex);
			pendingFormData = formData;
			pendingAction = '?/recoverWithKey';
		} catch (e) {
			recoveryError = `Recovery failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
		} finally {
			recoveryLoading = false;
		}
	}

	async function submitPendingForm() {
		if (!pendingFormData || !pendingAction) return;

		submitting = true;
		const isFresh = pendingAction.includes('resetFresh');

		try {
			const response = await fetch(pendingAction, {
				method: 'POST',
				body: pendingFormData
			});

			// Handle server errors
			if (!response.ok) {
				const html = await response.text();
				// Try to extract error message from superforms response
				const match = html.match(/"message":"([^"]+)"/);
				const errorMsg =
					match?.[1] || 'An error occurred while resetting your password. Please try again.';

				if (isFresh) freshError = errorMsg;
				else recoveryError = errorMsg;

				showRecoveryKey = false;
				return;
			}

			// Success — redirect to dashboard
			window.location.href = response.redirected ? response.url : '/dashboard';
		} catch (e) {
			const errorMsg = `Network error: ${e instanceof Error ? e.message : 'Unknown error'}`;
			if (isFresh) freshError = errorMsg;
			else recoveryError = errorMsg;
			showRecoveryKey = false;
		} finally {
			submitting = false;
		}
	}
</script>

<div class="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
	{#if showRecoveryKey}
		<!-- Show recovery key before final submission -->
		<div class="z-10 w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl">
			<RecoveryKeyDisplay
				recoveryKey={generatedRecoveryKey}
				onAcknowledge={submitPendingForm}
				title="Save Your New Recovery Key"
				description="Please save your new recovery key before continuing. Your password will be updated after you click Continue."
				loading={submitting}
			/>
		</div>
	{:else}
		<div class="z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
			<div class="mb-6">
				<h1 class="text-2xl font-bold text-gray-900">Reset Your Password</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Set a new password for your account and encryption keys.
				</p>
			</div>

			<!-- Tab Selection -->
			{#if data.hasRecoveryKey}
				<div class="mb-6 flex rounded-lg border border-border">
					<button
						class="flex-1 rounded-l-lg px-4 py-2 text-sm font-medium transition-colors {activeTab ===
						'recovery'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted'}"
						onclick={() => (activeTab = 'recovery')}
					>
						<Key class="mr-1 inline h-4 w-4" />
						Use Recovery Key
					</button>
					<button
						class="flex-1 rounded-r-lg px-4 py-2 text-sm font-medium transition-colors {activeTab ===
						'fresh'
							? 'bg-primary text-primary-foreground'
							: 'text-muted-foreground hover:bg-muted'}"
						onclick={() => (activeTab = 'fresh')}
					>
						<ShieldCheck class="mr-1 inline h-4 w-4" />
						Fresh Reset
					</button>
				</div>
			{/if}

			{#if activeTab === 'recovery' && data.hasRecoveryKey}
				<!-- Recovery Key Reset -->
				<form method="POST" action="?/recoverWithKey" use:recoveryEnhance class="space-y-4">
					<div class="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800">
						<ShieldCheck class="mr-1 inline h-4 w-4" />
						Using your recovery key preserves all your encrypted file access.
					</div>

					<div>
						<label for="recovery_key" class="mb-1 block text-sm font-medium text-gray-700"
							>Recovery Key</label
						>
						<Input
							id="recovery_key"
							type="text"
							placeholder="Enter your recovery key"
							bind:value={recoveryKey}
							class="font-mono text-sm"
						/>
					</div>

					<div>
						<label for="recovery_password" class="mb-1 block text-sm font-medium text-gray-700"
							>New Password</label
						>
						<Input
							id="recovery_password"
							type="password"
							placeholder="At least 7 characters"
							bind:value={recoveryNewPassword}
						/>
					</div>

					<div>
						<label
							for="recovery_confirm_password"
							class="mb-1 block text-sm font-medium text-gray-700">Confirm Password</label
						>
						<Input
							id="recovery_confirm_password"
							type="password"
							placeholder="Confirm your password"
							bind:value={recoveryConfirmPassword}
						/>
					</div>

					{#if recoveryError}
						<p class="text-sm text-destructive">{recoveryError}</p>
					{/if}

					<Button type="submit" class="w-full" disabled={recoveryLoading}>
						{#if recoveryLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Recover & Reset Password
					</Button>
				</form>
			{:else}
				<!-- Fresh Reset -->
				<form method="POST" action="?/resetFresh" use:freshEnhance class="space-y-4">
					<div class="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
						<AlertTriangle class="mr-1 inline h-4 w-4" />
						This will generate new encryption keys. You will lose access to previously encrypted files
						until a teammate re-shares them.
					</div>

					<div>
						<label for="new_password" class="mb-1 block text-sm font-medium text-gray-700"
							>New Password</label
						>
						<Input
							id="new_password"
							type="password"
							placeholder="At least 7 characters"
							bind:value={newPassword}
						/>
					</div>

					<div>
						<label for="confirm_password" class="mb-1 block text-sm font-medium text-gray-700"
							>Confirm Password</label
						>
						<Input
							id="confirm_password"
							type="password"
							placeholder="Confirm your password"
							bind:value={confirmPassword}
						/>
					</div>

					{#if freshError}
						<p class="text-sm text-destructive">{freshError}</p>
					{/if}

					<Button type="submit" class="w-full" disabled={freshLoading}>
						{#if freshLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Reset Password & Generate New Keys
					</Button>
				</form>
			{/if}

			<div class="mt-4 text-center">
				<a
					href="/login"
					class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to login
				</a>
			</div>
		</div>
	{/if}
</div>
