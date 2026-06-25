<script lang="ts">
	import type { PageProps } from './$types';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Plus, Trash2, Lock, ArrowLeft, Check, Loader2, AlertCircle } from '@lucide/svelte';
	import { SvelteSet } from 'svelte/reactivity';

	let { data }: PageProps = $props();

	// Target User Name
	const displayName = $derived(
		[data.targetUser.first_name, data.targetUser.last_name].filter(Boolean).join(' ') || 'User'
	);

	const targetUserEmail = $derived(data.targetUser.email);
	const targetUserRole = $derived(data.targetUser.role);

	// ──────────────────────────────────────────────────────────
	// User Permissions State
	// ──────────────────────────────────────────────────────────
	let userSubmitting = $state(false);
	let userSaveMessage = $state<string | null>(null);
	const localUserPermissions = new SvelteSet<string>();

	// Initialize user permissions
	$effect(() => {
		localUserPermissions.clear();
		for (const id of data.targetUserPermissionIds) {
			localUserPermissions.add(id);
		}
		userSaveMessage = null;
	});

	const isUserPermissionsDirty = $derived(() => {
		const original = new SvelteSet(data.targetUserPermissionIds);
		if (original.size !== localUserPermissions.size) return true;
		for (const id of localUserPermissions) {
			if (!original.has(id)) return true;
		}
		return false;
	});

	function toggleUserPermission(permissionId: string) {
		if (localUserPermissions.has(permissionId)) {
			localUserPermissions.delete(permissionId);
		} else {
			localUserPermissions.add(permissionId);
		}
	}

	function toggleUserCategory(category: string) {
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		const allChecked = catPerms.every((p) => localUserPermissions.has(p.permission_id));

		for (const perm of catPerms) {
			if (allChecked) {
				localUserPermissions.delete(perm.permission_id);
			} else {
				localUserPermissions.add(perm.permission_id);
			}
		}
	}

	function isUserCategoryFullyChecked(category: string): boolean {
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		return catPerms.every((p) => localUserPermissions.has(p.permission_id));
	}

	function isUserCategoryPartiallyChecked(category: string): boolean {
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		const checked = catPerms.filter((p) => localUserPermissions.has(p.permission_id));
		return checked.length > 0 && checked.length < catPerms.length;
	}

	// ──────────────────────────────────────────────────────────
	// Role Presets Drawer State
	// ──────────────────────────────────────────────────────────
	let activeRole = $state<(typeof data.roles)[number] | null>(null);
	const localRolePermissions = new SvelteSet<string>();
	let roleSubmitting = $state(false);
	let roleSaveMessage = $state<string | null>(null);

	function openRolePreset(role: (typeof data.roles)[number]) {
		activeRole = role;
		localRolePermissions.clear();
		roleSaveMessage = null;
		const grantedIds = data.rolePermissionMap[role.name] ?? [];
		// System Admin template is readonly and has all permissions
		const ids =
			role.name === 'System Admin' ? data.allPermissions.map((p) => p.permission_id) : grantedIds;
		for (const id of ids) {
			localRolePermissions.add(id);
		}
	}

	function closeRolePreset() {
		activeRole = null;
	}

	const isRolePermissionsDirty = $derived(() => {
		if (!activeRole || activeRole.name === 'System Admin') return false;
		const original = new SvelteSet(data.rolePermissionMap[activeRole.name] ?? []);
		if (original.size !== localRolePermissions.size) return true;
		for (const id of localRolePermissions) {
			if (!original.has(id)) return true;
		}
		return false;
	});

	function toggleRolePermission(permissionId: string) {
		if (!activeRole || activeRole.name === 'System Admin') return;
		if (localRolePermissions.has(permissionId)) {
			localRolePermissions.delete(permissionId);
		} else {
			localRolePermissions.add(permissionId);
		}
	}

	function toggleRoleCategory(category: string) {
		if (!activeRole || activeRole.name === 'System Admin') return;
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		const allChecked = catPerms.every((p) => localRolePermissions.has(p.permission_id));

		for (const perm of catPerms) {
			if (allChecked) {
				localRolePermissions.delete(perm.permission_id);
			} else {
				localRolePermissions.add(perm.permission_id);
			}
		}
	}

	function isRoleCategoryFullyChecked(category: string): boolean {
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		return catPerms.every((p) => localRolePermissions.has(p.permission_id));
	}

	function isRoleCategoryPartiallyChecked(category: string): boolean {
		const catPerms = data.allPermissions.filter((p) => p.category === category);
		const checked = catPerms.filter((p) => localRolePermissions.has(p.permission_id));
		return checked.length > 0 && checked.length < catPerms.length;
	}

	// Group permissions by category for both matrices
	const groupedPermissions = $derived(() => {
		const groups: { category: string; permissions: typeof data.allPermissions }[] = [];
		const categoryMap: Record<string, typeof data.allPermissions> = {};

		for (const perm of data.allPermissions) {
			if (!categoryMap[perm.category]) {
				categoryMap[perm.category] = [];
			}
			categoryMap[perm.category].push(perm);
		}

		for (const category of Object.keys(categoryMap)) {
			groups.push({ category, permissions: categoryMap[category] });
		}

		return groups;
	});

	// ──────────────────────────────────────────────────────────
	// Dialogs for Roles Management
	// ──────────────────────────────────────────────────────────
	let createRoleOpen = $state(false);
	let deleteRoleOpen = $state(false);
	let newRoleName = $state('');
	let newRoleDescription = $state('');
	let createSubmitting = $state(false);
	let deleteSubmitting = $state(false);
	let roleActionError = $state<string | null>(null);

	// Sync User Permissions defaults from a role preset (local helper)
	function applyRolePresetToUser(roleName: string) {
		const presetIds = data.rolePermissionMap[roleName] ?? [];
		localUserPermissions.clear();
		for (const id of presetIds) {
			localUserPermissions.add(id);
		}
		userSaveMessage = `Loaded default permissions from role preset "${roleName}". Save changes to apply.`;
	}
</script>

<main class="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
	<!-- Header -->
	<div class="mb-8 flex items-center gap-4">
		<Button variant="outline" size="icon" href="/users">
			<ArrowLeft class="size-4" />
		</Button>
		<div>
			<div class="flex items-center gap-2.5">
				<h1 class="text-xl font-bold tracking-tight">{displayName}'s Permissions</h1>
				<span class="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
					{targetUserRole ?? 'No Role'}
				</span>
			</div>
			<p class="text-sm text-muted-foreground">
				Configure individual overrides for {targetUserEmail}.
			</p>
		</div>
	</div>

	<div class="flex flex-col items-start gap-8 md:flex-row">
		<!-- Left Sidebar: Roles list -->
		<aside
			class="flex w-full shrink-0 flex-col gap-4 border-b border-border pb-6 md:w-60 md:border-r md:border-b-0 md:pr-6 md:pb-0"
		>
			<div>
				<h2 class="mb-3 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
					Roles Preset
				</h2>
				<p class="mb-4 text-[11px] leading-normal text-muted-foreground">
					Click a role to view & configure its template prebuilt permissions.
				</p>
			</div>

			<div class="flex flex-col gap-1.5">
				{#each data.roles as role (role.role_id)}
					<div
						class="group flex w-full items-center justify-between rounded-md border border-border/50 bg-card p-2 text-left text-sm font-medium transition-colors hover:bg-muted/50"
					>
						<button
							class="flex flex-1 items-center gap-1.5 text-left"
							onclick={() => openRolePreset(role)}
						>
							{#if role.name === 'System Admin'}
								<Lock class="size-3.5 text-muted-foreground" />
							{/if}
							{role.name}
							{#if !role.is_system}
								<span
									class="py-0.2 rounded bg-primary/10 px-1 text-[9px] font-semibold text-primary"
								>
									Custom
								</span>
							{/if}
						</button>

						<!-- Apply preset button -->
						{#if role.name !== 'System Admin'}
							<button
								type="button"
								class="rounded px-1.5 py-0.5 text-[10px] text-primary opacity-0 transition-opacity group-hover:opacity-100 hover:underline"
								onclick={() => applyRolePresetToUser(role.name)}
								title="Apply this preset to the user below"
							>
								Apply
							</button>
						{/if}
					</div>
				{/each}
			</div>

			<Button
				variant="outline"
				size="sm"
				class="mt-2 justify-center gap-1.5"
				onclick={() => (createRoleOpen = true)}
			>
				<Plus class="size-3.5" />
				New Role
			</Button>
		</aside>

		<!-- Main Area: User Permissions Checkbox Matrix -->
		<section class="w-full flex-1">
			<div class="mb-4 flex items-center justify-between">
				<div>
					<h2 class="text-base font-semibold">Individual Permissions Override</h2>
					<p class="text-xs text-muted-foreground">
						Check permissions explicitly granted to this user.
					</p>
				</div>
			</div>

			<form
				method="POST"
				action="?/saveUserPermissions"
				use:enhance={() => {
					userSubmitting = true;
					userSaveMessage = null;
					return async ({ result }) => {
						userSubmitting = false;
						if (result.type === 'failure') {
							userSaveMessage = (result.data as { error?: string })?.error ?? 'Failed to save.';
						} else {
							userSaveMessage = 'User permissions updated successfully!';
							await invalidate('db:user-permissions-page');
						}
					};
				}}
			>
				<input
					type="hidden"
					name="permission_ids"
					value={JSON.stringify(Array.from(localUserPermissions))}
				/>

				{#if targetUserRole === 'System Admin'}
					<div
						class="rounded-lg border border-blue-200 bg-blue-50/50 p-4 text-sm text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-300"
					>
						System Admin role automatically grants all system permissions. No individual overrides
						are necessary.
					</div>
				{:else}
					<div class="overflow-hidden rounded-lg border border-border bg-card">
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
									<Table.Row
										class="bg-muted/40 text-xs font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted/40"
									>
										<Table.Cell class="w-12">
											<button
												type="button"
												class="flex size-4 items-center justify-center rounded border transition-colors
													{isUserCategoryFullyChecked(group.category)
													? 'border-primary bg-primary text-primary-foreground'
													: isUserCategoryPartiallyChecked(group.category)
														? 'border-primary bg-primary/30'
														: 'border-muted-foreground/30'}"
												onclick={() => toggleUserCategory(group.category)}
											>
												{#if isUserCategoryFullyChecked(group.category)}
													<Check class="size-3" />
												{:else}
													<div class="size-1.5 rounded-sm bg-primary"></div>
												{/if}
											</button>
										</Table.Cell>
										<Table.Cell colspan={2}>
											{group.category}
										</Table.Cell>
									</Table.Row>

									{#each group.permissions as perm (perm.permission_id)}
										<Table.Row
											class="cursor-pointer transition-colors hover:bg-accent/40"
											onclick={() => toggleUserPermission(perm.permission_id)}
										>
											<Table.Cell class="w-12 pl-8">
												<button
													type="button"
													class="flex size-4.5 items-center justify-center rounded border transition-colors
														{localUserPermissions.has(perm.permission_id)
														? 'border-primary bg-primary text-primary-foreground'
														: 'border-muted-foreground/30 hover:border-primary/50'}"
													onclick={(e) => {
														e.stopPropagation();
														toggleUserPermission(perm.permission_id);
													}}
												>
													{#if localUserPermissions.has(perm.permission_id)}
														<Check class="size-3" />
													{/if}
												</button>
											</Table.Cell>
											<Table.Cell class="text-sm font-medium">{perm.label}</Table.Cell>
											<Table.Cell class="hidden text-xs text-muted-foreground sm:table-cell">
												{perm.description ?? ''}
											</Table.Cell>
										</Table.Row>
									{/each}
								{/each}
							</Table.Body>
						</Table.Root>
					</div>

					{#if userSaveMessage}
						<div
							class="mt-4 flex items-center gap-2 rounded-lg border p-3 text-sm
							{userSaveMessage.includes('successfully')
								? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
								: 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'}"
						>
							<AlertCircle class="size-4 shrink-0" />
							<span>{userSaveMessage}</span>
						</div>
					{/if}

					<div class="mt-6 flex items-center gap-3">
						<Button type="submit" disabled={userSubmitting || !isUserPermissionsDirty()}>
							{#if userSubmitting}
								<Loader2 class="mr-2 size-4 animate-spin" />
								Saving...
							{:else}
								Save User Overrides
							{/if}
						</Button>
						{#if isUserPermissionsDirty()}
							<span class="text-xs font-medium text-amber-600 dark:text-amber-400">
								You have unsaved changes to this user's permissions
							</span>
						{/if}
					</div>
				{/if}
			</form>
		</section>
	</div>
</main>

<!-- Slide-over Drawer / Sheet for Role Presets -->
<Sheet.Root
	open={!!activeRole}
	onOpenChange={(open) => {
		if (!open) closeRolePreset();
	}}
>
	<Sheet.Content side="right" class="flex h-full w-full max-w-lg flex-col gap-0 p-0">
		{#if activeRole}
			<!-- Header -->
			<Sheet.Header class="relative border-b border-border p-6 pr-12 text-left">
				<div class="flex items-center gap-2">
					<Sheet.Title class="text-lg font-semibold"
						>{activeRole.name}'s Template Permissions</Sheet.Title
					>
					{#if !activeRole.is_system}
						<span
							class="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary"
						>
							Custom
						</span>
					{/if}
				</div>
				<Sheet.Description class="mt-0.5 text-xs text-muted-foreground">
					Configure default prebuilt permissions for this role.
				</Sheet.Description>
			</Sheet.Header>

			<!-- Body -->
			<div class="flex-1 space-y-6 overflow-y-auto p-6">
				<!-- Role sync notice -->
				<div
					class="rounded-lg border border-blue-200 bg-blue-50/50 p-3.5 text-xs text-blue-700 dark:border-blue-800/40 dark:bg-blue-950/20 dark:text-blue-300"
				>
					<strong>Note:</strong> Changes to this preset will sync to
					<strong>all existing users</strong>
					assigned to the "{activeRole.name}" role.
				</div>

				{#if activeRole.name === 'System Admin'}
					<div
						class="rounded-lg border border-border bg-muted/40 p-4 text-center text-sm text-muted-foreground italic"
					>
						System Admin preset permissions are read-only and automatically encompass all features.
					</div>
				{/if}

				<form
					id="role-preset-form"
					method="POST"
					action="?/updateRolePermissions"
					use:enhance={() => {
						roleSubmitting = true;
						roleSaveMessage = null;
						return async ({ result }) => {
							roleSubmitting = false;
							if (result.type === 'failure') {
								roleSaveMessage = (result.data as { error?: string })?.error ?? 'Failed to save.';
							} else {
								roleSaveMessage = 'Preset template saved and synced successfully!';
								await invalidate('db:user-permissions-page');
							}
						};
					}}
				>
					<input type="hidden" name="role" value={activeRole.name} />
					<input
						type="hidden"
						name="permission_ids"
						value={JSON.stringify(Array.from(localRolePermissions))}
					/>

					{#if activeRole.name !== 'System Admin'}
						<div class="overflow-hidden rounded-lg border border-border">
							<Table.Root>
								<Table.Header>
									<Table.Row>
										<Table.Head class="w-12"></Table.Head>
										<Table.Head class="text-xs">Permission</Table.Head>
									</Table.Row>
								</Table.Header>
								<Table.Body>
									{#each groupedPermissions() as group (group.category)}
										<Table.Row
											class="bg-muted/40 text-[10px] font-semibold tracking-wider text-muted-foreground uppercase hover:bg-muted/40"
										>
											<Table.Cell class="w-10">
												<button
													type="button"
													class="flex size-4 items-center justify-center rounded border transition-colors
														{isRoleCategoryFullyChecked(group.category)
														? 'border-primary bg-primary text-primary-foreground'
														: isRoleCategoryPartiallyChecked(group.category)
															? 'border-primary bg-primary/30'
															: 'border-muted-foreground/30'}"
													onclick={() => toggleRoleCategory(group.category)}
												>
													{#if isRoleCategoryFullyChecked(group.category)}
														<Check class="size-3" />
													{:else}
														<div class="size-1.5 rounded-sm bg-primary"></div>
													{/if}
												</button>
											</Table.Cell>
											<Table.Cell>
												{group.category}
											</Table.Cell>
										</Table.Row>

										{#each group.permissions as perm (perm.permission_id)}
											<Table.Row
												class="cursor-pointer transition-colors hover:bg-accent/40"
												onclick={() => toggleRolePermission(perm.permission_id)}
											>
												<Table.Cell class="w-10 pl-6">
													<button
														type="button"
														class="flex size-4 items-center justify-center rounded border transition-colors
															{localRolePermissions.has(perm.permission_id)
															? 'border-primary bg-primary text-primary-foreground'
															: 'border-muted-foreground/30 hover:border-primary/50'}"
														onclick={(e) => {
															e.stopPropagation();
															toggleRolePermission(perm.permission_id);
														}}
													>
														{#if localRolePermissions.has(perm.permission_id)}
															<Check class="size-3" />
														{/if}
													</button>
												</Table.Cell>
												<Table.Cell>
													<span class="block text-xs font-medium">{perm.label}</span>
													{#if perm.description}
														<span
															class="mt-0.5 block text-[10px] leading-normal text-muted-foreground"
														>
															{perm.description}
														</span>
													{/if}
												</Table.Cell>
											</Table.Row>
										{/each}
									{/each}
								</Table.Body>
							</Table.Root>
						</div>
					{/if}
				</form>
			</div>

			<!-- Footer -->
			<Sheet.Footer
				class="flex shrink-0 flex-row items-center justify-between border-t border-border bg-card p-6"
			>
				<div>
					{#if activeRole.name !== 'System Admin' && !activeRole.is_system}
						<Button
							variant="outline"
							size="sm"
							class="hover:text-destructive-foreground gap-1.5 text-destructive hover:bg-destructive"
							onclick={() => {
								closeRolePreset();
								deleteRoleOpen = true;
							}}
						>
							<Trash2 class="size-3.5" />
							Delete Role
						</Button>
					{/if}
				</div>

				<div class="flex items-center gap-3">
					{#if roleSaveMessage}
						<span class="text-xs font-medium text-emerald-600 dark:text-emerald-400">
							{roleSaveMessage}
						</span>
					{/if}

					{#if activeRole.name !== 'System Admin'}
						<Button
							type="submit"
							form="role-preset-form"
							size="sm"
							disabled={roleSubmitting || !isRolePermissionsDirty()}
						>
							{#if roleSubmitting}
								<Loader2 class="mr-1.5 size-3.5 animate-spin" />
								Saving...
							{:else}
								Save Changes
							{/if}
						</Button>
					{/if}
				</div>
			</Sheet.Footer>
		{/if}
	</Sheet.Content>
</Sheet.Root>

<!-- Create Role Dialog -->
<Dialog.Root bind:open={createRoleOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Create New Role Preset</Dialog.Title>
			<Dialog.Description>
				Add a custom role with a unique name. You can configure preset default permissions after
				creation.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/createRole"
			use:enhance={() => {
				createSubmitting = true;
				roleActionError = null;
				return async ({ result }) => {
					createSubmitting = false;
					if (result.type === 'failure') {
						roleActionError =
							(result.data as { error?: string })?.error ?? 'Failed to create role preset.';
					} else {
						createRoleOpen = false;
						newRoleName = '';
						newRoleDescription = '';
						await invalidate('db:user-permissions-page');
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

			{#if roleActionError}
				<p class="mb-3 text-sm text-destructive">{roleActionError}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (createRoleOpen = false)}
					>Cancel</Button
				>
				<Button type="submit" disabled={createSubmitting || !newRoleName.trim()}>
					{createSubmitting ? 'Creating...' : 'Create Preset'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Role Dialog -->
<Dialog.Root bind:open={deleteRoleOpen}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Delete Custom Role Preset</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to delete this custom role template? This action cannot be undone. All
				template bindings will be deleted.
			</Dialog.Description>
		</Dialog.Header>

		<form
			method="POST"
			action="?/deleteRole"
			use:enhance={() => {
				deleteSubmitting = true;
				roleActionError = null;
				return async ({ result }) => {
					deleteSubmitting = false;
					if (result.type === 'failure') {
						roleActionError =
							(result.data as { error?: string })?.error ?? 'Failed to delete role preset.';
					} else {
						deleteRoleOpen = false;
						await invalidate('db:user-permissions-page');
					}
				};
			}}
		>
			<input type="hidden" name="role_id" value={activeRole?.role_id ?? ''} />
			<input type="hidden" name="role_name" value={activeRole?.name ?? ''} />

			{#if roleActionError}
				<p class="mb-3 text-sm text-destructive">{roleActionError}</p>
			{/if}

			<Dialog.Footer>
				<Button type="button" variant="outline" onclick={() => (deleteRoleOpen = false)}
					>Cancel</Button
				>
				<Button type="submit" variant="destructive" disabled={deleteSubmitting}>
					{deleteSubmitting ? 'Deleting...' : 'Delete Preset'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
