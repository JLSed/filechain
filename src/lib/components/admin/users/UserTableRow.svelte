<script lang="ts">
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import { Archive, Eye, Shield, KeyRound } from '@lucide/svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';

	interface ComponentProps {
		user: UserProfile;
		openDetails: (user: UserProfile) => void;
		openEditRole: (user: UserProfile) => void;
		openArchive: (user: UserProfile) => void;
	}

	let { user, openDetails, openEditRole, openArchive }: ComponentProps = $props();

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
					{#if user.is_active}
						<Badge variant="default" class="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
					{:else}
						<Badge variant="secondary">Archived</Badge>
					{/if}
				</Table.Cell>
			</Table.Row>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onclick={() => openDetails(user)}>
			<Eye /> View Details
		</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => openEditRole(user)}>
			<Shield /> Edit Role
		</DropdownMenu.Item>
		<DropdownMenu.Item disabled>
			<KeyRound /> Edit Access
		</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item variant="destructive" onclick={() => openArchive(user)}>
			<Archive /> Archive User
		</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
