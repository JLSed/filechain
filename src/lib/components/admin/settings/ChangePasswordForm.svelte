<script lang="ts">
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import initWasm, { re_encrypt_private_key } from '$lib/pkg/rust';
	import { hexToBytes } from '$lib/utils/crypto';
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { type ChangePasswordData } from '$lib/types/FormTypes';
	import { untrack } from 'svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Label from '$lib/shadcn/components/ui/label/label.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { Loader2, AlertCircle, CheckCircle2 } from '@lucide/svelte';

	interface UserSecretData {
		encrypted_private_key: string;
		pk_salt: string;
		pk_nonce: string;
	}

	interface ComponentProps {
		data: {
			form: SuperValidated<ChangePasswordData>;
			userSecret: UserSecretData | null;
		};
	}

	let { data }: ComponentProps = $props();

	const { form, errors, submitting, message } = superForm(untrack(() => data.form));

	let confirmNewPassword = $state('');
	let localError = $state('');
	let successMessage = $state('');
	let isProcessing = $state(false);
	let showLogoutPrompt = $state(false);
	let logoutForm: HTMLFormElement | undefined;
	let passwordMismatch = $derived(
		confirmNewPassword.length > 0 && $form.new_password !== confirmNewPassword
	);

	function confirmAndLogout() {
		logoutForm?.requestSubmit();
	}

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
		localError = '';
		successMessage = '';
		showLogoutPrompt = false;

		if (!data.userSecret) {
			localError = 'Master password is not configured for your account.';
			cancel();
			return;
		}

		if ($form.current_password.length < 7) {
			localError = 'Current password must be at least 7 characters long.';
			cancel();
			return;
		}

		if ($form.new_password.length < 7) {
			localError = 'New password must be at least 7 characters long.';
			cancel();
			return;
		}

		if ($form.new_password !== confirmNewPassword) {
			localError = 'New password and confirmation do not match.';
			cancel();
			return;
		}

		isProcessing = true;

		try {
			await initWasm();

			const encryptedKeyBytes = hexToBytes(data.userSecret.encrypted_private_key);
			const oldNonceBytes = hexToBytes(data.userSecret.pk_nonce);

			const result = re_encrypt_private_key(
				$form.current_password,
				data.userSecret.pk_salt,
				encryptedKeyBytes,
				oldNonceBytes,
				$form.new_password
			);

			if (!result.success) {
				localError = result.error_message || 'Current password is incorrect.';
				isProcessing = false;
				cancel();
				return;
			}

			formData.set('encrypted_private_key', result.encrypted_private_key_hex);
			formData.set('pk_salt', result.salt);
			formData.set('pk_nonce', result.nonce_hex);
		} catch (err) {
			console.error('Failed to prepare re-encrypted key material:', err);
			localError = 'Failed to process secure key update. Please try again.';
			isProcessing = false;
			cancel();
			return;
		}

		return async ({ update, result }) => {
			isProcessing = false;
			if (result.type === 'failure') {
				localError = result.data?.message?.toString() || 'Failed to change password.';
			} else if (result.type === 'success') {
				successMessage = 'Password changed successfully.';
				showLogoutPrompt = true;
			}
			update();
		};
	};
</script>

<Card.Root class="w-full max-w-2xl">
	<Card.Header>
		<Card.Title>Change Password</Card.Title>
		<Card.Description>
			Update your account password and securely re-wrap your private encryption key.
		</Card.Description>
	</Card.Header>

	<form
		method="POST"
		action="?/changePassword"
		use:enhance={submitEnhance}
		class="flex flex-col gap-4"
	>
		<Card.Content class="space-y-4">
			{#if !data.userSecret}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">
						Master password is not configured for this account yet.
					</p>
				</div>
			{/if}

			{#if $message}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{$message}</p>
				</div>
			{/if}

			{#if localError}
				<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
					<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
					<p class="text-sm text-destructive">{localError}</p>
				</div>
			{/if}

			{#if successMessage}
				<div class="flex items-start gap-2 rounded-md bg-green-500/10 p-3">
					<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-green-500" />
					<p class="text-sm text-green-500">{successMessage}</p>
				</div>
			{/if}

			<input type="hidden" name="encrypted_private_key" value="" />
			<input type="hidden" name="pk_salt" value="" />
			<input type="hidden" name="pk_nonce" value="" />

			<div class="space-y-2">
				<Label for="current_password">Current Password</Label>
				<Input
					type="password"
					id="current_password"
					name="current_password"
					bind:value={$form.current_password}
					placeholder="Enter your current password"
					disabled={isProcessing || $submitting}
				/>
				{#if getError($errors.current_password)}
					<p class="text-xs text-destructive">{getError($errors.current_password)}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="new_password">New Password</Label>
				<Input
					type="password"
					id="new_password"
					name="new_password"
					bind:value={$form.new_password}
					placeholder="Enter your new password"
					disabled={isProcessing || $submitting}
				/>
				{#if getError($errors.new_password)}
					<p class="text-xs text-destructive">{getError($errors.new_password)}</p>
				{/if}
			</div>

			<div class="space-y-2">
				<Label for="confirm_new_password">Confirm New Password</Label>
				<Input
					type="password"
					id="confirm_new_password"
					bind:value={confirmNewPassword}
					placeholder="Confirm your new password"
					disabled={isProcessing || $submitting}
				/>
				{#if passwordMismatch}
					<p class="text-xs text-destructive">Passwords do not match.</p>
				{/if}
			</div>
		</Card.Content>

		<Card.Footer class="justify-end">
			<Button
				type="submit"
				disabled={isProcessing ||
					$submitting ||
					showLogoutPrompt ||
					!data.userSecret ||
					passwordMismatch ||
					!$form.current_password ||
					!$form.new_password ||
					!confirmNewPassword}
			>
				{#if isProcessing}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Securing keys...
				{:else if $submitting}
					<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					Changing password...
				{:else}
					Change Password
				{/if}
			</Button>
		</Card.Footer>
	</form>

	<form method="POST" action="?/confirmLogout" bind:this={logoutForm} class="hidden"></form>
</Card.Root>

{#if showLogoutPrompt}
	<button
		type="button"
		class="fixed inset-0 z-40 bg-black/50"
		onclick={confirmAndLogout}
		aria-label="Confirm password change"
	></button>

	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="w-full max-w-md rounded-lg border border-border bg-background p-6 shadow-xl">
			<div class="flex items-start gap-2 rounded-md bg-green-500/10 p-3">
				<CheckCircle2 class="mt-0.5 size-4 shrink-0 text-green-500" />
				<div class="space-y-1">
					<p class="text-sm font-medium text-green-600">Password Changed Successfully</p>
					<p class="text-sm text-muted-foreground">Click OK to log in again.</p>
				</div>
			</div>

			<div class="mt-4 flex justify-end">
				<Button type="button" onclick={confirmAndLogout}>OK</Button>
			</div>
		</div>
	</div>
{/if}
