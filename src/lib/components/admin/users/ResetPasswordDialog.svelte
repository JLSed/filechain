<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { enhance } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { Loader2, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import type { UserProfile } from '$lib/types/DatabaseTypes';

	interface Props {
		user: UserProfile | null;
		open: boolean;
	}

	let { user, open = $bindable(false) }: Props = $props();

	let isSubmitting = $state(false);
	let errorMessage = $state<string | null>(null);

	const userName = $derived(
		user ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || 'this user' : 'this user'
	);
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Reset Password for {userName}?</Dialog.Title>
			<Dialog.Description>
				This will initiate a password and encryption key reset for this user.
			</Dialog.Description>
		</Dialog.Header>

		{#if user}
			<div class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
				<AlertTriangle class="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
				<div>
					<p class="text-sm font-medium text-amber-800">This action will:</p>
					<ul class="mt-1 list-inside list-disc space-y-1 text-xs text-amber-700">
						<li>Send a password reset email to the user</li>
						<li>Delete their encryption keys and file access</li>
						<li>Require a teammate to re-share files after reset</li>
					</ul>
				</div>
			</div>

			<form
				method="POST"
				action="/users?/resetUserPassword"
				use:enhance={() => {
					isSubmitting = true;
					errorMessage = null;
					return async ({ result }) => {
						isSubmitting = false;
						if (result.type === 'success') {
							toast.success(`Password reset initiated for ${userName}.`);
							open = false;
							await invalidate('db:user-profiles');
						} else if (result.type === 'failure') {
							errorMessage =
								(result.data as { error?: string })?.error ?? 'Failed to reset password.';
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
					<Button type="submit" variant="destructive" disabled={isSubmitting}>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						{/if}
						Reset Password
					</Button>
				</Dialog.Footer>
			</form>
		{/if}
	</Dialog.Content>
</Dialog.Root>
