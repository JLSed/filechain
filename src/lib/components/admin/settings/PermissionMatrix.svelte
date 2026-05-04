<script lang="ts">
	import type { Permission, Role } from '$lib/types/DatabaseTypes';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Check, Loader2 } from '@lucide/svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';

	interface ComponentProps {
		role: Role;
		allPermissions: Permission[];
		grantedPermissionIds: string[];
	}

	let { role, allPermissions, grantedPermissionIds }: ComponentProps = $props();

	const isSystemAdmin = $derived(role.name === 'System Admin');

	// Local state for checkboxes — initialized from granted permission IDs
	let localGranted = new SvelteSet<string>();
	let submitting = $state(false);
	let saveMessage = $state<string | null>(null);

	// Reset local state when role changes
	$effect(() => {
		localGranted.clear();
		const ids = isSystemAdmin ? allPermissions.map((p) => p.permission_id) : grantedPermissionIds;
		for (const id of ids) {
			localGranted.add(id);
		}
		saveMessage = null;
	});

	// Group permissions by category
	const groupedPermissions = $derived(() => {
		const groups: { category: string; permissions: Permission[] }[] = [];
		const categoryMap = new SvelteMap<string, Permission[]>();

		for (const perm of allPermissions) {
			if (!categoryMap.has(perm.category)) {
				categoryMap.set(perm.category, []);
			}
			categoryMap.get(perm.category)!.push(perm);
		}

		for (const [category, perms] of categoryMap) {
			groups.push({ category, permissions: perms });
		}

		return groups;
	});

	// Track dirty state
	const isDirty = $derived(() => {
		if (isSystemAdmin) return false;
		const original = new SvelteSet(grantedPermissionIds);
		if (original.size !== localGranted.size) return true;
		for (const id of localGranted) {
			if (!original.has(id)) return true;
		}
		return false;
	});

	function togglePermission(permissionId: string) {
		if (isSystemAdmin) return;

		if (localGranted.has(permissionId)) {
			localGranted.delete(permissionId);
		} else {
			localGranted.add(permissionId);
		}
	}

	function toggleCategory(category: string) {
		if (isSystemAdmin) return;

		const catPerms = allPermissions.filter((p) => p.category === category);
		const allChecked = catPerms.every((p) => localGranted.has(p.permission_id));

		for (const perm of catPerms) {
			if (allChecked) {
				localGranted.delete(perm.permission_id);
			} else {
				localGranted.add(perm.permission_id);
			}
		}
	}

	function isCategoryFullyChecked(category: string): boolean {
		const catPerms = allPermissions.filter((p) => p.category === category);
		return catPerms.every((p) => localGranted.has(p.permission_id));
	}

	function isCategoryPartiallyChecked(category: string): boolean {
		const catPerms = allPermissions.filter((p) => p.category === category);
		const checked = catPerms.filter((p) => localGranted.has(p.permission_id));
		return checked.length > 0 && checked.length < catPerms.length;
	}
</script>

<form
	method="POST"
	action="?/updatePermissions"
	use:enhance={() => {
		submitting = true;
		saveMessage = null;
		return async ({ result }) => {
			submitting = false;
			if (result.type === 'failure') {
				saveMessage = (result.data as { error?: string })?.error ?? 'Failed to save.';
			} else {
				saveMessage = 'Permissions saved successfully!';
				await invalidate('db:role-permissions');
			}
		};
	}}
>
	<input type="hidden" name="role" value={role.name} />
	<input type="hidden" name="permission_ids" value={JSON.stringify(Array.from(localGranted))} />

	{#if isSystemAdmin}
		<div
			class="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300"
		>
			System Admin has all permissions and cannot be modified.
		</div>
	{/if}

	<div class="rounded-lg border border-border">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="w-12"></Table.Head>
					<Table.Head>Permission</Table.Head>
					<Table.Head class="hidden sm:table-cell">Description</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each groupedPermissions() as group (group.category)}
					<!-- Category header row -->
					<Table.Row class="bg-muted/50 hover:bg-muted/50">
						<Table.Cell class="w-12">
							<button
								type="button"
								class="flex size-5 items-center justify-center rounded border transition-colors
									{isSystemAdmin ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
									{isCategoryFullyChecked(group.category)
									? 'border-primary bg-primary text-primary-foreground'
									: isCategoryPartiallyChecked(group.category)
										? 'border-primary bg-primary/30'
										: 'border-muted-foreground/30'}"
								onclick={() => toggleCategory(group.category)}
								disabled={isSystemAdmin}
							>
								{#if isCategoryFullyChecked(group.category)}
									<Check class="size-3.5" />
								{:else if isCategoryPartiallyChecked(group.category)}
									<div class="size-2 rounded-sm bg-primary"></div>
								{/if}
							</button>
						</Table.Cell>
						<Table.Cell colspan={2} class="text-sm font-semibold">
							{group.category}
						</Table.Cell>
					</Table.Row>

					<!-- Individual permission rows -->
					{#each group.permissions as perm (perm.permission_id)}
						<Table.Row
							class="cursor-pointer transition-colors hover:bg-accent/50
								{isSystemAdmin ? 'opacity-60' : ''}"
							onclick={() => togglePermission(perm.permission_id)}
						>
							<Table.Cell class="w-12 pl-8">
								<button
									type="button"
									class="flex size-5 items-center justify-center rounded border transition-colors
										{isSystemAdmin ? 'cursor-not-allowed' : 'cursor-pointer'}
										{localGranted.has(perm.permission_id)
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-muted-foreground/30 hover:border-primary/50'}"
									disabled={isSystemAdmin}
									onclick={(e) => {
										e.stopPropagation();
										togglePermission(perm.permission_id);
									}}
								>
									{#if localGranted.has(perm.permission_id)}
										<Check class="size-3.5" />
									{/if}
								</button>
							</Table.Cell>
							<Table.Cell class="text-sm font-medium">{perm.label}</Table.Cell>
							<Table.Cell class="hidden text-sm text-muted-foreground sm:table-cell">
								{perm.description ?? ''}
							</Table.Cell>
						</Table.Row>
					{/each}
				{/each}
			</Table.Body>
		</Table.Root>
	</div>

	{#if saveMessage}
		<p
			class="mt-3 text-sm {saveMessage.includes('success')
				? 'text-green-600 dark:text-green-400'
				: 'text-destructive'}"
		>
			{saveMessage}
		</p>
	{/if}

	{#if !isSystemAdmin}
		<div class="mt-4 flex items-center gap-3">
			<Button type="submit" disabled={submitting || !isDirty()}>
				{#if submitting}
					<Loader2 class="mr-2 size-4 animate-spin" />
					Saving...
				{:else}
					Save Permissions
				{/if}
			</Button>
			{#if isDirty()}
				<span class="text-sm text-amber-600 dark:text-amber-400"> You have unsaved changes </span>
			{/if}
		</div>
	{/if}
</form>
