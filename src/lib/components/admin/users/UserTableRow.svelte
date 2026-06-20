<script lang="ts">
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import { Archive, Eye, Shield, KeyRound, ExternalLink, RotateCcw } from '@lucide/svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { goto } from '$app/navigation';

	interface ComponentProps {
		user: UserProfile;
		currentUserRole?: string | null;
		openDetails: (user: UserProfile) => void;
		openEditRole: (user: UserProfile) => void;
		openArchive: (user: UserProfile) => void;
		openResetPassword?: (user: UserProfile) => void;
		canEditUser?: boolean;
		canArchiveUser?: boolean;
		canResetPassword?: boolean;
	}

	let {
		user,
		currentUserRole,
		openDetails,
		openEditRole,
		openArchive,
		openResetPassword,
		canEditUser = true,
		canArchiveUser = true,
		canResetPassword = false
	}: ComponentProps = $props();

	function formatName(profile: UserProfile): string {
		const parts = [profile.first_name, profile.last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : '—';
	}
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Table.Row {...props} class="cursor-pointer even:bg-muted">
				<Table.Cell>
					<div class="flex flex-col">
						<span class="font-medium">{formatName(user)}</span>
						{#if user.middle_name}
							<span class="text-xs text-muted-foreground">{user.middle_name}</span>
						{/if}
					</div>
				</Table.Cell>
				<Table.Cell class="text-muted-foreground">{user.email ?? '—'}</Table.Cell>
				<Table.Cell>
					{#if user.role}
						<Badge variant="outline">{user.role}</Badge>
					{:else}
						<span class="text-xs text-muted-foreground italic">No role</span>
					{/if}
				</Table.Cell>
				<Table.Cell>
					{#if !user.is_active}
						<Badge variant="secondary">Archived</Badge>
					{:else if user.has_secret}
						<Badge variant="default" class="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
					{:else}
						<Badge
							variant="outline"
							class="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
							>Invited</Badge
						>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onclick={() => openDetails(user)}>
			<Eye /> View Details
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => goto(`/users/${user.user_id}`)}>
			<ExternalLink /> View Full Profile
		</DropdownMenu.Item>
		<DropdownMenu.Item
			onclick={() => openEditRole(user)}
			disabled={!canEditUser || (user.role === 'System Admin' && currentUserRole === 'User Admin')}
		>
			<Shield /> Edit Role
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => goto('/settings/permissions')}>
			<KeyRound /> Edit Access
		</DropdownMenu.Item>
		{#if canResetPassword && openResetPassword}
			<DropdownMenu.Item onclick={() => openResetPassword(user)} class="text-amber-600">
				<RotateCcw /> Reset Password
			</DropdownMenu.Item>
		{/if}
		<DropdownMenu.Separator />
		<DropdownMenu.Item
			variant="destructive"
			onclick={() => openArchive(user)}
			disabled={!canArchiveUser}
		>
			<Archive /> Archive User
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
