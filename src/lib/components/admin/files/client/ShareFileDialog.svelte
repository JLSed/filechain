<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { Share2, Loader2, Search, AlertCircle, UserPlus } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';

	interface ShareableUser {
		user_id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		role: string | null;
		public_key: string;
	}

	interface Props {
		file: FileMetadata | null;
		open: boolean;
		onconfirm: (file: FileMetadata, selectedUsers: ShareableUser[]) => void;
		onclose: () => void;
	}

	let { file, open = $bindable(), onconfirm, onclose }: Props = $props();

	let loading = $state(false);
	let shareableUsers = $state<ShareableUser[]>([]);
	let selectedUserIds = $state<Set<string>>(new Set());
	let searchQuery = $state('');
	let errorMessage = $state<string | null>(null);

	const filteredUsers = $derived(() => {
		const query = searchQuery.toLowerCase().trim();
		if (!query) return shareableUsers;
		return shareableUsers.filter((u) => {
			const name = [u.first_name, u.last_name].filter(Boolean).join(' ').toLowerCase();
			const email = (u.email ?? '').toLowerCase();
			return name.includes(query) || email.includes(query);
		});
	});

	const selectedCount = $derived(selectedUserIds.size);

	async function fetchShareableUsers(): Promise<void> {
		if (!file) return;

		loading = true;
		errorMessage = null;
		shareableUsers = [];
		selectedUserIds = new Set();
		searchQuery = '';

		try {
			const supabase = createBrowserClient();

			// 1. Fetch all user IDs who already have access (have a file_dek entry)
			const { data: dekData, error: dekError } = await supabase
				.schema('api')
				.from('file_dek')
				.select('owner_id')
				.eq('file_id', file.file_id);

			if (dekError) {
				errorMessage = 'Failed to fetch current access list.';
				return;
			}

			const existingOwnerIds = new Set(
				(dekData ?? []).map((d: { owner_id: string }) => d.owner_id)
			);

			// 2. Fetch all active users who have a public key set up
			const { data: usersWithKeys, error: usersError } = await supabase
				.schema('api')
				.from('user_secrets')
				.select('user_id, public_key');

			if (usersError) {
				errorMessage = 'Failed to fetch user encryption keys.';
				return;
			}

			// Filter to users who DON'T already have access and DO have a public key
			const eligibleUserIds = (usersWithKeys ?? [])
				.filter(
					(s: { user_id: string; public_key: string | null }) =>
						s.public_key && !existingOwnerIds.has(s.user_id)
				)
				.map((s: { user_id: string; public_key: string }) => ({
					user_id: s.user_id,
					public_key: s.public_key
				}));

			if (eligibleUserIds.length === 0) {
				shareableUsers = [];
				return;
			}

			// 3. Fetch profiles for eligible users
			const userIds = eligibleUserIds.map((u: { user_id: string }) => u.user_id);
			const { data: profilesData, error: profilesError } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('user_id, first_name, last_name, email, role')
				.in('user_id', userIds)
				.eq('is_active', true);

			if (profilesError) {
				errorMessage = 'Failed to fetch user profiles.';
				return;
			}

			// Build the public_key map
			const keyMap = new SvelteMap<string, string>();
			for (const u of eligibleUserIds) {
				keyMap.set(u.user_id, u.public_key);
			}

			shareableUsers = (profilesData ?? []).map(
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

	function toggleUser(userId: string): void {
		const next = new SvelteSet(selectedUserIds);
		if (next.has(userId)) {
			next.delete(userId);
		} else {
			next.add(userId);
		}
		selectedUserIds = next;
	}

	function getUserDisplayName(user: ShareableUser): string {
		const parts = [user.first_name, user.last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : 'Unknown User';
	}

	function getUserInitials(user: ShareableUser): string {
		const first = user.first_name?.[0] ?? '';
		const last = user.last_name?.[0] ?? '';
		return (first + last).toUpperCase() || '?';
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			shareableUsers = [];
			selectedUserIds = new Set();
			searchQuery = '';
			errorMessage = null;
			onclose();
		}
	}

	function handleConfirm(): void {
		if (!file || selectedCount === 0) return;
		const selected = shareableUsers.filter((u) => selectedUserIds.has(u.user_id));
		onconfirm(file, selected);
	}

	$effect(() => {
		if (open && file) {
			untrack(() => fetchShareableUsers());
		}
	});
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Share2 class="size-5 text-primary" />
				Share File
			</Dialog.Title>
			<Dialog.Description class="text-wrap">
				{#if file}
					Select users to share
					<span class="font-medium break-all">{file.file_name}</span> with
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="py-2">
			{#if loading}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<Loader2 class="size-6 animate-spin text-primary" />
					<p class="text-sm text-muted-foreground">Loading users…</p>
				</div>
			{:else if errorMessage}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<AlertCircle class="size-6 text-destructive" />
					<p class="text-sm text-destructive">{errorMessage}</p>
				</div>
			{:else if shareableUsers.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<UserPlus class="size-6 text-muted-foreground/50" />
					<p class="text-sm text-muted-foreground">
						All eligible users already have access to this file.
					</p>
				</div>
			{:else}
				<!-- Search bar -->
				<div class="relative mb-3">
					<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						type="text"
						placeholder="Search by name or email…"
						class="pl-9"
						bind:value={searchQuery}
					/>
				</div>

				<!-- User list -->
				<div class="max-h-64 space-y-0.5 overflow-y-auto rounded-md border p-1">
					{#each filteredUsers() as user (user.user_id)}
						{@const isSelected = selectedUserIds.has(user.user_id)}
						<button
							type="button"
							class="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors
								{isSelected ? 'bg-primary/10 ring-1 ring-primary/20' : 'hover:bg-muted/50'}"
							onclick={() => toggleUser(user.user_id)}
						>
							<!-- Checkbox indicator -->
							<div
								class="flex size-4 shrink-0 items-center justify-center rounded border transition-colors
									{isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30'}"
							>
								{#if isSelected}
									<svg
										xmlns="http://www.w3.org/2000/svg"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										stroke-width="3"
										stroke-linecap="round"
										stroke-linejoin="round"
										class="size-3"
									>
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								{/if}
							</div>

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
						</button>
					{:else}
						<div class="py-4 text-center">
							<p class="text-sm text-muted-foreground">No users match your search.</p>
						</div>
					{/each}
				</div>

				<!-- Selected count -->
				{#if selectedCount > 0}
					<div class="mt-3 flex items-center justify-center">
						<Badge
							variant="secondary"
							class="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"
						>
							<UserPlus class="size-3.5" />
							{selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
						</Badge>
					</div>
				{/if}
			{/if}
		</div>

		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>
				Cancel
			</Button>
			{#if shareableUsers.length > 0}
				<Button type="button" disabled={selectedCount === 0} onclick={handleConfirm}>
					<Share2 class="size-4" />
					Continue
				</Button>
			{/if}
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
