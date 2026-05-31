<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Label from '$lib/shadcn/components/ui/label/label.svelte';
	import { AlertCircle, Loader2, Lock, Share2 } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import initWasm, { re_encrypt_dek_for_recipient } from '$lib/pkg/rust';
	import { hexToBytes } from '$lib/utils/crypto';

	interface SelectedUser {
		user_id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		role: string | null;
		public_key: string;
	}

	interface ReEncryptResult {
		success: boolean;
		encrypted_dek_hex: string;
		dek_nonce_hex: string;
		ephemeral_public_key_hex: string;
		error_message: string;
	}

	interface Props {
		file: FileMetadata | null;
		selectedUsers: SelectedUser[];
		open: boolean;
		onshared: () => void;
		onclose: () => void;
	}

	let { file, selectedUsers, open = $bindable(), onshared, onclose }: Props = $props();

	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let progress = $state(0);

	function reset(): void {
		password = '';
		error = '';
		loading = false;
		progress = 0;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	function getUserDisplayName(user: SelectedUser): string {
		const parts = [user.first_name, user.last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : 'Unknown User';
	}

	async function handleSubmit(e: SubmitEvent): Promise<void> {
		e.preventDefault();

		if (!file || selectedUsers.length === 0) return;

		if (!password.trim()) {
			error = 'Enter your password';
			return;
		}

		error = '';
		loading = true;
		progress = 0;

		try {
			await initWasm();
			const supabase = createBrowserClient();

			// 1. Get current user's encrypted private key
			const {
				data: { user: authUser }
			} = await supabase.auth.getUser();

			if (!authUser) {
				throw new Error('You must be logged in to share files.');
			}

			const { data: secret, error: secretError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('encrypted_private_key, pk_salt, pk_nonce')
				.eq('user_id', authUser.id)
				.single();

			if (secretError || !secret) {
				throw new Error('Could not retrieve your encryption keys.');
			}

			// 2. Get the current user's DEK entry for this file
			const { data: myDek, error: dekError } = await supabase
				.schema('api')
				.from('file_dek')
				.select('encrypted_dek, dek_nonce, ephemeral_public_key')
				.eq('file_id', file.file_id)
				.eq('owner_id', authUser.id)
				.single();

			if (dekError || !myDek) {
				throw new Error('You do not have access to this file. Cannot share.');
			}

			// 3. Re-encrypt DEK for each selected user and insert file_dek rows
			const dekInserts: Array<{
				file_id: string;
				owner_id: string;
				encrypted_dek: string;
				dek_nonce: string;
				ephemeral_public_key: string;
			}> = [];

			for (let i = 0; i < selectedUsers.length; i++) {
				const targetUser = selectedUsers[i];
				progress = i + 1;

				const result: ReEncryptResult = re_encrypt_dek_for_recipient({
					password: password.trim(),
					pk_salt: secret.pk_salt,
					encrypted_private_key: Array.from(hexToBytes(secret.encrypted_private_key)),
					pk_nonce: Array.from(hexToBytes(secret.pk_nonce)),
					ephemeral_public_key: Array.from(hexToBytes(myDek.ephemeral_public_key)),
					encrypted_dek: Array.from(hexToBytes(myDek.encrypted_dek)),
					dek_nonce: Array.from(hexToBytes(myDek.dek_nonce)),
					target_public_key: Array.from(hexToBytes(targetUser.public_key))
				});

				if (!result.success) {
					const msg = result.error_message || 'Re-encryption failed';
					throw new Error(
						msg.includes('decryption') || msg.includes('password')
							? 'Incorrect password.'
							: `Failed to share with ${getUserDisplayName(targetUser)}: ${msg}`
					);
				}

				dekInserts.push({
					file_id: file.file_id,
					owner_id: targetUser.user_id,
					encrypted_dek: result.encrypted_dek_hex,
					dek_nonce: result.dek_nonce_hex,
					ephemeral_public_key: result.ephemeral_public_key_hex
				});
			}

			// 4. Batch insert all new file_dek entries
			const { error: insertError } = await supabase
				.schema('api')
				.from('file_dek')
				.insert(dekInserts);

			if (insertError) {
				throw new Error(`Failed to save access keys: ${insertError.message}`);
			}

			// 5. Audit log
			const userNames = selectedUsers.map((u) => getUserDisplayName(u)).join(', ');
			logAuditEvent({
				details: `[actor] shared file "${file.file_name}" with ${selectedUsers.length} user(s): ${userNames}`,
				eventType: 'Edited File'
			});

			reset();
			onshared();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred.';
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
				Confirm Share
			</Dialog.Title>
			<Dialog.Description>
				Enter your password to share
				{#if file}
					<span class="font-medium">{file.file_name}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<form onsubmit={handleSubmit}>
			<div class="grid gap-4 py-2">
				<!-- Summary of selected users -->
				<div class="rounded-md border bg-muted/30 p-3">
					<p class="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
						Sharing with
					</p>
					<div class="flex flex-wrap gap-1.5">
						{#each selectedUsers as user (user.user_id)}
							<Badge variant="secondary" class="text-xs">
								{getUserDisplayName(user)}
							</Badge>
						{/each}
					</div>
				</div>

				<!-- Password input -->
				<div class="grid gap-2">
					<Label for="share-password">Password</Label>
					<Input
						id="share-password"
						type="password"
						placeholder="Enter your password"
						bind:value={password}
						disabled={loading}
						autocomplete="off"
					/>
				</div>

				<!-- Progress -->
				{#if loading && selectedUsers.length > 1}
					<div class="flex items-center gap-2 text-xs text-muted-foreground">
						<Loader2 class="size-3 animate-spin" />
						Encrypting key for user {progress} of {selectedUsers.length}…
					</div>
				{/if}

				{#if error}
					<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
						<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{error}</p>
					</div>
				{/if}
			</div>

			<Dialog.Footer>
				<Button
					type="button"
					variant="outline"
					disabled={loading}
					onclick={() => handleOpenChange(false)}
				>
					Cancel
				</Button>
				<Button type="submit" disabled={loading}>
					{#if loading}
						<Loader2 class="size-4 animate-spin" />
						Sharing…
					{:else}
						<Share2 class="size-4" />
						Share with {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''}
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
