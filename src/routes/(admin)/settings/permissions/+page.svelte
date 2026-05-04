<script lang="ts">
	import type { PageProps } from './$types';
	import PermissionMatrix from '$lib/components/admin/settings/PermissionMatrix.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Shield, Plus, Trash2, Lock } from '@lucide/svelte';

	let { data }: PageProps = $props();

	let selectedRoleName = $state('');

	// Sync selected role when data changes (e.g. after create/delete)
	$effect(() => {
		if (!selectedRoleName || !data.roles.find((r) => r.name === selectedRoleName)) {
			selectedRoleName = data.roles[0]?.name ?? '';
		}
	});
	let createRoleOpen = $state(false);
	let deleteRoleOpen = $state(false);
	let newRoleName = $state('');
	let newRoleDescription = $state('');
	let createSubmitting = $state(false);
	let deleteSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const selectedRole = $derived(data.roles.find((r) => r.name === selectedRoleName));
	const selectedPermissions = $derived(data.rolePermissionMap[selectedRoleName] ?? []);

	// Custom roles only (non-system)
	const canDelete = $derived(selectedRole && !selectedRole.is_system);
</script>

<main class="p-4 sm:p-6">
	<div class="mb-6">
		<div class="flex items-center gap-3">
			<Shield class="size-6 text-primary" />
			<div>
				<h1 class="text-xl font-bold">Role Permissions</h1>
				<p class="text-sm text-muted-foreground">
					Configure which permissions each role has access to.
				</p>
			</div>
		</div>
	</div>

	<!-- Role selector tabs -->
	<div class="mb-6 flex flex-wrap items-center gap-2">
		{#each data.roles as role (role.role_id)}
			<button
				class="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors
					{selectedRoleName === role.name
					? 'border-primary bg-primary text-primary-foreground'
					: 'border-border bg-background hover:bg-muted'}"
				onclick={() => {
					selectedRoleName = role.name;
					errorMessage = null;
				}}
			>
				{#if role.name === 'System Admin'}
					<Lock class="size-3.5" />
				{/if}
				{role.name}
				{#if !role.is_system}
					<span
						class="ml-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
					>
						Custom
					</span>
				{/if}
			</button>
		{/each}

		<Button variant="outline" size="sm" class="gap-1.5" onclick={() => (createRoleOpen = true)}>
			<Plus class="size-3.5" />
			New Role
		</Button>
	</div>

	<!-- Permission Matrix for selected role -->
	{#if selectedRole}
		<div class="mb-4 flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold">{selectedRole.name}</h2>
				{#if selectedRole.description}
					<p class="text-sm text-muted-foreground">{selectedRole.description}</p>
				{/if}
			</div>
			{#if canDelete}
				<Button
					variant="outline"
					size="sm"
					class="hover:text-destructive-foreground gap-1.5 text-destructive hover:bg-destructive"
					onclick={() => (deleteRoleOpen = true)}
				>
					<Trash2 class="size-3.5" />
					Delete Role
				</Button>
			{/if}
		</div>

		{#key selectedRoleName}
			<PermissionMatrix
				role={selectedRole}
				allPermissions={data.allPermissions}
				grantedPermissionIds={selectedPermissions}
			/>
		{/key}
	{/if}
</main>

<!-- Create Role Dialog -->
<Dialog.Root bind:open={createRoleOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Create New Role</Dialog.Title>
			<Dialog.Description>
				Add a custom role with a unique name. You can assign permissions after creation.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/createRole"
			use:enhance={() => {
				createSubmitting = true;
				errorMessage = null;
				return async ({ result }) => {
					createSubmitting = false;
					if (result.type === 'failure') {
						errorMessage = (result.data as { error?: string })?.error ?? 'Failed to create role.';
					} else {
						createRoleOpen = false;
						newRoleName = '';
						newRoleDescription = '';
						await invalidate('db:role-permissions');
					}
				};
			}}
		>
			<div class="grid gap-4 py-4">
				<div class="space-y-2">
					<label for="role-name" class="text-sm font-medium">
						Role Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="role-name"
						name="name"
						bind:value={newRoleName}
						placeholder="e.g. Design Team"
					/>
				</div>
				<div class="space-y-2">
					<label for="role-description" class="text-sm font-medium">Description</label>
					<Input
						id="role-description"
						name="description"
						bind:value={newRoleDescription}
						placeholder="Brief description of this role"
					/>
				</div>
			</div>

			{#if errorMessage}
				<p class="mb-3 text-sm text-destructive">{errorMessage}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createRoleOpen = false)}
					>Cancel</Button
				>
				<Button type="submit" disabled={createSubmitting || !newRoleName.trim()}>
					{createSubmitting ? 'Creating...' : 'Create Role'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Role Dialog -->
<Dialog.Root bind:open={deleteRoleOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete Role</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete <strong>{selectedRole?.name}</strong>? This action cannot be
				undone. All permission assignments for this role will be removed.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/deleteRole"
			use:enhance={() => {
				deleteSubmitting = true;
				errorMessage = null;
				return async ({ result }) => {
					deleteSubmitting = false;
					if (result.type === 'failure') {
						errorMessage = (result.data as { error?: string })?.error ?? 'Failed to delete role.';
					} else {
						deleteRoleOpen = false;
						selectedRoleName = '';
						await invalidate('db:role-permissions');
					}
				};
			}}
		>
			<input type="hidden" name="role_id" value={selectedRole?.role_id ?? ''} />
			<input type="hidden" name="role_name" value={selectedRole?.name ?? ''} />

			{#if errorMessage}
				<p class="mb-3 text-sm text-destructive">{errorMessage}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (deleteRoleOpen = false)}
					>Cancel</Button
				>
				<Button type="submit" variant="destructive" disabled={deleteSubmitting}>
					{deleteSubmitting ? 'Deleting...' : 'Delete Role'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
