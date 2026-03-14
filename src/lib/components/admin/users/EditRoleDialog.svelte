<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import { USER_ROLES } from '$lib/constants/SchemaData';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';

	interface ComponentProps {
		user: UserProfile | null;
		open: boolean;
	}

	let { user, open = $bindable(false) }: ComponentProps = $props();
	let selectedRole = $state('');
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	$effect(() => {
		if (user && open) {
			selectedRole = user.role ?? '';
		}
	});
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Edit User Role</Dialog.Title>
			<Dialog.Description>
				Select a new role for <strong>{user?.first_name} {user?.last_name}</strong>
			</Dialog.Description>
		</Dialog.Header>

		{#if user}
			<form
				method="POST"
				action="?/editRole"
				use:enhance={() => {
					submitting = true;
					errorMessage = null;
					return async ({ result, update }) => {
						submitting = false;
						if (result.type === 'failure') {
							errorMessage =
								(result.data as { error?: string })?.error ?? 'Failed to update role.';
						} else {
							open = false;
							await invalidate('db:user-profiles');
						}
					};
				}}
			>
				<input type="hidden" name="user_id" value={user.user_id} />
				<input type="hidden" name="role" value={selectedRole} />

				<div class="grid gap-2 py-4">
					{#each USER_ROLES as role}
						<label
							class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted
								{selectedRole === role ? 'border-primary bg-primary/5' : 'border-border'}"
						>
							<input
								type="radio"
								name="role_selection"
								value={role}
								checked={selectedRole === role}
								onchange={() => (selectedRole = role)}
								class="accent-primary"
							/>
							<span class="text-sm font-medium">{role}</span>
						</label>
					{/each}
				</div>

				{#if errorMessage}
					<p class="mb-3 text-sm text-destructive">{errorMessage}</p>
				{/if}

				<Dialog.Footer>
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit" disabled={submitting || !selectedRole || selectedRole === user.role}>
						{submitting ? 'Saving...' : 'Save Role'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
