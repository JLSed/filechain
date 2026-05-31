<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Label from '$lib/shadcn/components/ui/label/label.svelte';
	import {
		Share2,
		Loader2,
		Search,
		AlertCircle,
		Lock,
		FileCheck,
		FileLock,
		ArrowLeft
	} from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import initWasm, { re_encrypt_dek_for_recipient } from '$lib/pkg/rust';
	import { hexToBytes } from '$lib/utils/crypto';

	interface ShareableUser {
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

	type Step = 'select-user' | 'confirm-access' | 'password';

	interface Props {
		files: FileMetadata[];
		open: boolean;
		onshared: () => void;
		onclose: () => void;
	}

	let { files, open = $bindable(), onshared, onclose }: Props = $props();

	// Shared state
	let step = $state<Step>('select-user');
	let errorMessage = $state<string | null>(null);

	// Step 1: User selection
	let loading = $state(false);
	let allUsers = $state<ShareableUser[]>([]);
	let searchQuery = $state('');
	let selectedUser = $state<ShareableUser | null>(null);

	// Step 2: Access confirmation
	let filesWithAccess = $state<FileMetadata[]>([]);
	let filesWithoutAccess = $state<FileMetadata[]>([]);
	let checkingAccess = $state(false);

	// Step 3: Password & sharing
	let password = $state('');
	let sharing = $state(false);
	let progress = $state(0);

	const filteredUsers = $derived(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return allUsers;
		return allUsers.filter((u) => {
			const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
			const email = (u.email ?? '').toLowerCase();
			return name.includes(query) || email.includes(query);
		});
	});

	function getUserDisplayName(user: ShareableUser): string {
		const parts = [user.first_name, user.last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : 'Unknown User';
	}

	function getUserInitials(user: ShareableUser): string {
		const first = user.first_name?.[0] ?? '';
		const last = user.last_name?.[0] ?? '';
		return (first + last).toUpperCase() || '?';
	}

	function reset(): void {
		step = 'select-user';
		loading = false;
		allUsers = [];
		searchQuery = '';
		selectedUser = null;
		filesWithAccess = [];
		filesWithoutAccess = [];
		checkingAccess = false;
		password = '';
		sharing = false;
		progress = 0;
		errorMessage = null;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	/** Step 1: Fetch all users except System Admins who have encryption keys */
	async function fetchUsers(): Promise<void> {
		loading = true;
		errorMessage = null;
		allUsers = [];

		try {
			const supabase = createBrowserClient();

			// Get current user ID to exclude self
			const {
				data: { user: authUser }
			} = await supabase.auth.getUser();

			// Fetch all users with encryption keys
			const { data: usersWithKeys, error: keysError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('user_id, public_key');

			if (keysError) {
				errorMessage = 'Failed to fetch user encryption keys.';
				return;
			}

			const eligibleUserIds = (usersWithKeys ?? [])
				.filter(
					(s: { user_id: string; public_key: string | null }) =>
						s.public_key && s.user_id !== authUser?.id
				)
				.map((s: { user_id: string; public_key: string }) => ({
					user_id: s.user_id,
					public_key: s.public_key
				}));

			if (eligibleUserIds.length === 0) {
				allUsers = [];
				return;
			}

			// Fetch profiles, excluding System Admins
			const userIds = eligibleUserIds.map((u: { user_id: string }) => u.user_id);
			const { data: profilesData, error: profilesError } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('user_id, first_name, last_name, email, role')
				.in('user_id', userIds)
				.eq('is_active', true)
				.neq('role', 'System Admin');

			if (profilesError) {
				errorMessage = 'Failed to fetch user profiles.';
				return;
			}

			const keyMap = new SvelteMap<string, string>();
			for (const u of eligibleUserIds) {
				keyMap.set(u.user_id, u.public_key);
			}

			allUsers = (profilesData ?? []).map(
				(p: {
					user_id: string;
					first_name: string | null;
					last_name: string | null;
					email: string | null;
					role: string | null;
				}) => ({
					user_id: p.user_id,
					first_name: p.first_name,
					last_name: p.last_name,
					email: p.email,
					role: p.role,
					public_key: keyMap.get(p.user_id) ?? ''
				})
			);
		} catch {
			errorMessage = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}

	/** Step 2: Check which files the selected user already has access to */
	async function checkUserAccess(): Promise<void> {
		if (!selectedUser) return;

		checkingAccess = true;
		errorMessage = null;

		try {
			const supabase = createBrowserClient();
			const fileIds = files.map((f) => f.file_id);

			// Fetch all file_dek entries for this user across all files
			const { data: dekData, error: dekError } = await supabase
				.schema('api')
				.from('file_dek')
				.select('file_id')
				.eq('owner_id', selectedUser.user_id)
				.in('file_id', fileIds);

			if (dekError) {
				errorMessage = 'Failed to check user access.';
				return;
			}

			const accessibleFileIds = new Set((dekData ?? []).map((d: { file_id: string }) => d.file_id));

			filesWithAccess = files.filter((f) => accessibleFileIds.has(f.file_id));
			filesWithoutAccess = files.filter((f) => !accessibleFileIds.has(f.file_id));

			// If user already has access to all files, show that
			if (filesWithoutAccess.length === 0) {
				step = 'confirm-access';
				return;
			}

			// If user has access to some files, show confirmation step
			if (filesWithAccess.length > 0) {
				step = 'confirm-access';
			} else {
				// No existing access, go straight to password
				step = 'password';
			}
		} catch {
			errorMessage = 'An unexpected error occurred while checking access.';
		} finally {
			checkingAccess = false;
		}
	}

	/** Step 3: Perform the share (DEK re-encryption for all files without access) */
	async function handleShare(e: SubmitEvent): Promise<void> {
		e.preventDefault();

		if (!selectedUser || filesWithoutAccess.length === 0) return;

		if (!password.trim()) {
			errorMessage = 'Enter your password';
			return;
		}

		errorMessage = null;
		sharing = true;
		progress = 0;

		try {
			await initWasm();
			const supabase = createBrowserClient();

			// Get current user's secrets
			const {
				data: { user: authUser }
			} = await supabase.auth.getUser();

			if (!authUser) throw new Error('You must be logged in.');

			const { data: secret, error: secretError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('encrypted_private_key, pk_salt, pk_nonce')
				.eq('user_id', authUser.id)
				.single();

			if (secretError || !secret) throw new Error('Could not retrieve your encryption keys.');

			const dekInserts: Array<{
				file_id: string;
				owner_id: string;
				encrypted_dek: string;
				dek_nonce: string;
				ephemeral_public_key: string;
			}> = [];

			for (let i = 0; i < filesWithoutAccess.length; i++) {
				const file = filesWithoutAccess[i];
				progress = i + 1;

				// Get the current user's DEK for this file
				const { data: myDek, error: dekError } = await supabase
					.schema('api')
					.from('file_dek')
					.select('encrypted_dek, dek_nonce, ephemeral_public_key')
					.eq('file_id', file.file_id)
					.eq('owner_id', authUser.id)
					.single();

				if (dekError || !myDek) {
					throw new Error(`You do not have access to "${file.file_name}". Cannot share this file.`);
				}

				const result: ReEncryptResult = re_encrypt_dek_for_recipient({
					password: password.trim(),
					pk_salt: secret.pk_salt,
					encrypted_private_key: Array.from(hexToBytes(secret.encrypted_private_key)),
					pk_nonce: Array.from(hexToBytes(secret.pk_nonce)),
					ephemeral_public_key: Array.from(hexToBytes(myDek.ephemeral_public_key)),
					encrypted_dek: Array.from(hexToBytes(myDek.encrypted_dek)),
					dek_nonce: Array.from(hexToBytes(myDek.dek_nonce)),
					target_public_key: Array.from(hexToBytes(selectedUser.public_key))
				});

				if (!result.success) {
					const msg = result.error_message || 'Re-encryption failed';
					throw new Error(
						msg.includes('decryption') || msg.includes('password')
							? 'Incorrect password.'
							: `Failed to share "${file.file_name}": ${msg}`
					);
				}

				dekInserts.push({
					file_id: file.file_id,
					owner_id: selectedUser.user_id,
					encrypted_dek: result.encrypted_dek_hex,
					dek_nonce: result.dek_nonce_hex,
					ephemeral_public_key: result.ephemeral_public_key_hex
				});
			}

			// Batch insert
			const { error: insertError } = await supabase
				.schema('api')
				.from('file_dek')
				.insert(dekInserts);

			if (insertError) throw new Error(`Failed to save access keys: ${insertError.message}`);

			// Audit log
			logAuditEvent({
				details: `[actor] shared ${filesWithoutAccess.length} file(s) with ${getUserDisplayName(selectedUser)}`,
				eventType: 'Edited File'
			});

			reset();
			onshared();
		} catch (err) {
			errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
		} finally {
			sharing = false;
		}
	}

	function selectUser(user: ShareableUser): void {
		selectedUser = user;
		checkUserAccess();
	}

	function goBack(): void {
		if (step === 'password') {
			step = filesWithAccess.length > 0 ? 'confirm-access' : 'select-user';
			password = '';
			errorMessage = null;
		} else if (step === 'confirm-access') {
			step = 'select-user';
			selectedUser = null;
			filesWithAccess = [];
			filesWithoutAccess = [];
			errorMessage = null;
		}
	}

	$effect(() => {
		if (open && files.length > 0) {
			untrack(() => fetchUsers());
		}
	});
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if step === 'password'}
					<Lock class="size-5 text-primary" />
					Confirm Share
				{:else}
					<Share2 class="size-5 text-primary" />
					Share All Files
				{/if}
			</Dialog.Title>
			<Dialog.Description>
				{#if step === 'select-user'}
					Select a user to share all application files with
				{:else if step === 'confirm-access' && selectedUser}
					Sharing files with <span class="font-medium">{getUserDisplayName(selectedUser)}</span>
				{:else if step === 'password' && selectedUser}
					Enter your password to share {filesWithoutAccess.length} file{filesWithoutAccess.length !==
					1
						? 's'
						: ''} with
					<span class="font-medium">{getUserDisplayName(selectedUser)}</span>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="py-2">
			<!-- Step 1: Select user -->
			{#if step === 'select-user'}
				{#if loading || checkingAccess}
					<div class="flex flex-col items-center justify-center gap-2 py-8">
						<Loader2 class="size-6 animate-spin text-primary" />
						<p class="text-sm text-muted-foreground">
							{checkingAccess ? 'Checking access…' : 'Loading users…'}
						</p>
					</div>
				{:else if errorMessage}
					<div class="flex flex-col items-center justify-center gap-2 py-8">
						<AlertCircle class="size-6 text-destructive" />
						<p class="text-sm text-destructive">{errorMessage}</p>
					</div>
				{:else if allUsers.length === 0}
					<div class="flex flex-col items-center justify-center gap-2 py-8">
						<Share2 class="size-6 text-muted-foreground/50" />
						<p class="text-sm text-muted-foreground">No eligible users found.</p>
					</div>
				{:else}
					<!-- Search -->
					<div class="relative mb-3">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="text"
							placeholder="Search by name or email…"
							class="pl-9"
							bind:value={searchQuery}
						/>
					</div>

					<!-- User list (single select) -->
					<div class="max-h-64 space-y-0.5 overflow-y-auto rounded-md border p-1">
						{#each filteredUsers() as user (user.user_id)}
							<button
								type="button"
								class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
								onclick={() => selectUser(user)}
							>
								<!-- Avatar circle -->
								<div
									class="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
								>
									{getUserInitials(user)}
								</div>

								<!-- User info -->
								<div class="min-w-0 flex-1">
									<div class="flex items-center gap-2">
										<p class="truncate text-sm font-medium">{getUserDisplayName(user)}</p>
										{#if user.role}
											<Badge variant="secondary" class="text-[10px] leading-tight capitalize">
												{user.role}
											</Badge>
										{/if}
									</div>
									{#if user.email}
										<p class="truncate text-xs text-muted-foreground">{user.email}</p>
									{/if}
								</div>

								<Share2 class="size-4 shrink-0 text-muted-foreground/40" />
							</button>
						{:else}
							<div class="py-4 text-center">
								<p class="text-sm text-muted-foreground">No users match your search.</p>
							</div>
						{/each}
					</div>
				{/if}

				<!-- Step 2: Confirm access -->
			{:else if step === 'confirm-access'}
				{#if errorMessage}
					<div class="flex flex-col items-center justify-center gap-2 py-8">
						<AlertCircle class="size-6 text-destructive" />
						<p class="text-sm text-destructive">{errorMessage}</p>
					</div>
				{:else if filesWithoutAccess.length === 0}
					<!-- User already has access to ALL files -->
					<div class="flex flex-col items-center justify-center gap-2 py-8">
						<FileCheck class="size-8 text-green-500" />
						<p class="text-sm font-medium">User already has access to all files</p>
						<p class="text-center text-xs text-muted-foreground">
							{selectedUser ? getUserDisplayName(selectedUser) : 'This user'} already has decryption keys
							for all {files.length} file{files.length !== 1 ? 's' : ''} in this application.
						</p>
					</div>
				{:else}
					<!-- Show which files user has / doesn't have access to -->
					<div class="space-y-3">
						{#if filesWithAccess.length > 0}
							<div class="rounded-md border border-yellow-500/20 bg-yellow-500/5 p-3">
								<p class="mb-2 text-xs font-medium text-yellow-600 dark:text-yellow-400">
									Already has access ({filesWithAccess.length} file{filesWithAccess.length !== 1
										? 's'
										: ''})
								</p>
								<div class="max-h-24 space-y-1 overflow-y-auto">
									{#each filesWithAccess as file (file.file_id)}
										<div class="flex items-center gap-2 text-xs text-muted-foreground">
											<FileCheck class="size-3.5 shrink-0 text-yellow-500" />
											<span class="truncate">{file.file_name}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						<div class="rounded-md border border-primary/20 bg-primary/5 p-3">
							<p class="mb-2 text-xs font-medium text-primary">
								Will be shared ({filesWithoutAccess.length} file{filesWithoutAccess.length !== 1
									? 's'
									: ''})
							</p>
							<div class="max-h-32 space-y-1 overflow-y-auto">
								{#each filesWithoutAccess as file (file.file_id)}
									<div class="flex items-center gap-2 text-xs">
										<FileLock class="size-3.5 shrink-0 text-primary" />
										<span class="truncate">{file.file_name}</span>
									</div>
								{/each}
							</div>
						</div>
					</div>
				{/if}

				<!-- Step 3: Password -->
			{:else if step === 'password'}
				<form id="share-all-form" onsubmit={handleShare}>
					<div class="grid gap-4">
						<!-- Summary -->
						<div class="rounded-md border bg-muted/30 p-3">
							<p class="mb-1.5 text-xs font-medium tracking-wide text-muted-foreground uppercase">
								Sharing {filesWithoutAccess.length} file{filesWithoutAccess.length !== 1 ? 's' : ''} with
							</p>
							{#if selectedUser}
								<Badge variant="secondary" class="text-xs">
									{getUserDisplayName(selectedUser)}
								</Badge>
							{/if}
						</div>

						<!-- Password -->
						<div class="grid gap-2">
							<Label for="share-all-password">Password</Label>
							<Input
								id="share-all-password"
								type="password"
								placeholder="Enter your password"
								bind:value={password}
								disabled={sharing}
								autocomplete="off"
							/>
						</div>

						<!-- Progress -->
						{#if sharing && filesWithoutAccess.length > 1}
							<div class="flex items-center gap-2 text-xs text-muted-foreground">
								<Loader2 class="size-3 animate-spin" />
								Encrypting file {progress} of {filesWithoutAccess.length}…
							</div>
						{/if}

						{#if errorMessage}
							<div class="flex items-start gap-2 rounded-md bg-destructive/10 p-3">
								<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
								<p class="text-sm text-destructive">{errorMessage}</p>
							</div>
						{/if}
					</div>
				</form>
			{/if}
		</div>

		<Dialog.Footer>
			{#if step === 'select-user'}
				<Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
					Cancel
				</Button>
			{:else if step === 'confirm-access'}
				<Button type="button" variant="outline" onclick={goBack}>
					<ArrowLeft class="size-4" />
					Back
				</Button>
				{#if filesWithoutAccess.length > 0}
					<Button
						type="button"
						onclick={() => {
							step = 'password';
							errorMessage = null;
						}}
					>
						Continue
					</Button>
				{:else}
					<Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
						Close
					</Button>
				{/if}
			{:else if step === 'password'}
				<Button type="button" variant="outline" disabled={sharing} onclick={goBack}>
					<ArrowLeft class="size-4" />
					Back
				</Button>
				<Button type="submit" form="share-all-form" disabled={sharing}>
					{#if sharing}
						<Loader2 class="size-4 animate-spin" />
						Sharing…
					{:else}
						<Share2 class="size-4" />
						Share {filesWithoutAccess.length} file{filesWithoutAccess.length !== 1 ? 's' : ''}
					{/if}
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
