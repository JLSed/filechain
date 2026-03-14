<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { TriangleAlert } from '@lucide/svelte';

	interface ComponentProps {
		user: UserProfile | null;
		open: boolean;
	}

	let { user, open = $bindable(false) }: ComponentProps = $props();
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Archive User</Dialog.Title>
			<Dialog.Description>
				Are you sure you want to archive this user account?
			</Dialog.Description>
		</Dialog.Header>

		{#if user}
			<div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
				<TriangleAlert class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
				<div>
					<p class="text-sm font-medium text-amber-800 dark:text-amber-200">
						{user.first_name} {user.last_name}
					</p>
					<p class="mt-1 text-xs text-amber-700 dark:text-amber-300">
						This user will be marked as inactive and will no longer be able to access the system.
						This action can be reversed by reactivating the user.
					</p>
				</div>
			</div>

			<form
				method="POST"
				action="?/archiveUser"
				use:enhance={() => {
					submitting = true;
					errorMessage = null;
					return async ({ result }) => {
						submitting = false;
						if (result.type === 'failure') {
							errorMessage =
								(result.data as { error?: string })?.error ?? 'Failed to archive user.';
						} else {
							open = false;
							await invalidate('db:user-profiles');
						}
					};
				}}
			>
				<input type="hidden" name="user_id" value={user.user_id} />

				{#if errorMessage}
					<p class="mt-3 text-sm text-destructive">{errorMessage}</p>
				{/if}

				<Dialog.Footer class="mt-4">
					<Button type="button" variant="outline" onclick={() => (open = false)}>Cancel</Button>
					<Button type="submit" variant="destructive" disabled={submitting}>
						{submitting ? 'Archiving...' : 'Archive User'}
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
