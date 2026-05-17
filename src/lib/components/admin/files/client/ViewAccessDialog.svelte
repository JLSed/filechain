<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap } from 'svelte/reactivity';
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { Users, Loader2, KeyRound, AlertCircle } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';

	interface AccessUser {
		user_id: string;
		first_name: string | null;
		last_name: string | null;
		email: string | null;
		role: string | null;
		granted_at: string;
	}

	interface Props {
		file: FileMetadata | null;
		open: boolean;
		onclose: () => void;
	}

	let { file, open = $bindable(), onclose }: Props = $props();

	let loading = $state(false);
	let accessUsers = $state<AccessUser[]>([]);
	let errorMessage = $state<string | null>(null);

	async function fetchAccessUsers(): Promise<void> {
		if (!file) return;

		loading = true;
		errorMessage = null;
		accessUsers = [];

		try {
			const supabase = createBrowserClient();

			// Fetch all DEK owners for this file
			const { data: dekData, error: dekError } = await supabase
				.schema('api')
				.from('file_dek')
				.select('owner_id, created_at')
				.eq('file_id', file.file_id);

			if (dekError) {
				errorMessage = 'Failed to fetch access keys.';
				return;
			}

			if (!dekData || dekData.length === 0) {
				accessUsers = [];
				return;
			}

			const ownerIds = dekData.map((d: { owner_id: string }) => d.owner_id);
			const grantedMap = new SvelteMap<string, string>();
			for (const d of dekData) {
				grantedMap.set(d.owner_id, d.created_at);
			}

			// Fetch user profiles for those owners
			const { data: profilesData, error: profilesError } = await supabase
				.schema('api')
				.from('user_profiles')
				.select('user_id, first_name, last_name, email, role')
				.in('user_id', ownerIds);

			if (profilesError) {
				errorMessage = 'Failed to fetch user profiles.';
				return;
			}

			accessUsers = (profilesData ?? []).map(
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
					granted_at: grantedMap.get(p.user_id) ?? ''
				})
			);
		} catch {
			errorMessage = 'An unexpected error occurred.';
		} finally {
			loading = false;
		}
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			accessUsers = [];
			errorMessage = null;
			onclose();
		}
	}

	function formatGrantedDate(dateStr: string): string {
		if (!dateStr) return '—';
		try {
			return new Intl.DateTimeFormat('en-US', {
				month: 'short',
				day: 'numeric',
				year: 'numeric'
			}).format(new Date(dateStr));
		} catch {
			return '—';
		}
	}

	function getUserDisplayName(user: AccessUser): string {
		const parts = [user.first_name, user.last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : 'Unknown User';
	}

	function getUserInitials(user: AccessUser): string {
		const first = user.first_name?.[0] ?? '';
		const last = user.last_name?.[0] ?? '';
		return (first + last).toUpperCase() || '?';
	}

	$effect(() => {
		if (open && file) {
			untrack(() => fetchAccessUsers());
		}
	});
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Users class="size-5 text-primary" />
				View Access
			</Dialog.Title>
			<Dialog.Description class="text-wrap">
				{#if file}
					Users with a decryption key for <span class="font-medium break-all">{file.file_name}</span
					>
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="py-2">
			{#if loading}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<Loader2 class="size-6 animate-spin text-primary" />
					<p class="text-sm text-muted-foreground">Loading access list…</p>
				</div>
			{:else if errorMessage}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<AlertCircle class="size-6 text-destructive" />
					<p class="text-sm text-destructive">{errorMessage}</p>
				</div>
			{:else if accessUsers.length === 0}
				<div class="flex flex-col items-center justify-center gap-2 py-8">
					<KeyRound class="size-6 text-muted-foreground/50" />
					<p class="text-sm text-muted-foreground">No users have access to this file.</p>
				</div>
			{:else}
				<div class="max-h-72 space-y-1 overflow-y-auto">
					{#each accessUsers as user (user.user_id)}
						<div
							class="flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/50"
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

							<!-- Granted date -->
							<div class="shrink-0 text-right">
								<p class="text-[10px] text-muted-foreground">Granted</p>
								<p class="text-xs text-muted-foreground">{formatGrantedDate(user.granted_at)}</p>
							</div>
						</div>
					{/each}
				</div>

				<!-- Summary -->
				<div class="mt-3 flex items-center justify-center">
					<Badge
						variant="secondary"
						class="gap-1.5 border-primary/20 bg-primary/5 px-3 py-1.5 text-primary"
					>
						<KeyRound class="size-3.5" />
						{accessUsers.length} user{accessUsers.length !== 1 ? 's' : ''} with access
					</Badge>
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button type="button" variant="outline" onclick={() => handleOpenChange(false)}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
