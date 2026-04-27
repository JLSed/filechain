<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Label from '$lib/shadcn/components/ui/label/label.svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { insertNotificationBatch } from '$lib/services/notification';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import { invalidate } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	interface ComponentProps {
		open: boolean;
		applicationNumber: string;
		teamAssigned: string | null;
		userId: string;
	}

	let {
		open = $bindable(false),
		applicationNumber,
		teamAssigned,
		userId
	}: ComponentProps = $props();

	let title = $state('');
	let description = $state('');
	let submitting = $state(false);

	function resetForm(): void {
		title = '';
		description = '';
	}

	async function handleSubmit(): Promise<void> {
		if (!title.trim()) {
			toast.error('Task title is required.');
			return;
		}

		submitting = true;
		try {
			const supabase = createBrowserClient();

			const { error } = await supabase
				.schema('api')
				.from('application_tasks')
				.insert({
					application_id: applicationNumber,
					title: title.trim(),
					description: description.trim() || null,
					created_by: userId
				});

			if (error) {
				toast.error(`Failed to add task: ${error.message}`);
				return;
			}

			// Notify team members about the new task
			if (teamAssigned) {
				const { data: teamMembers } = await supabase
					.schema('api')
					.from('user_profiles')
					.select('user_id')
					.eq('role', teamAssigned)
					.neq('user_id', userId);

				if (teamMembers && teamMembers.length > 0) {
					const recipientIds = teamMembers.map((m: { user_id: string }) => m.user_id);
					await insertNotificationBatch(supabase, recipientIds, {
						actorId: userId,
						title: 'New Task Added',
						message: `A new task "${title.trim()}" was added for application ${applicationNumber}`,
						link: `/application/timeline`
					});
				}
			}

			logAuditEvent({
				details: `[actor] added task "${title.trim()}" to application ${applicationNumber}`,
				eventType: 'Added Task'
			});

			toast.success('Task added successfully');
			resetForm();
			open = false;
			await invalidate('db:timeline');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
		} finally {
			submitting = false;
		}
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(isOpen) => {
		if (!isOpen) resetForm();
	}}
>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Add Task</Dialog.Title>
			<Dialog.Description>
				Create a new task for application {applicationNumber}
			</Dialog.Description>
		</Dialog.Header>

		<form
			onsubmit={(e) => {
				e.preventDefault();
				handleSubmit();
			}}
			class="mt-2 space-y-4"
		>
			<div class="space-y-2">
				<Label for="task-title">Title</Label>
				<Input id="task-title" bind:value={title} placeholder="Enter task title" required />
			</div>

			<div class="space-y-2">
				<Label for="task-description">Additional Details</Label>
				<Input
					id="task-description"
					bind:value={description}
					placeholder="Optional details about this task"
				/>
			</div>

			<Dialog.Footer>
				<Button variant="outline" type="button" onclick={() => (open = false)}>Cancel</Button>
				<Button type="submit" disabled={submitting || !title.trim()}>
					{submitting ? 'Adding...' : 'Add Task'}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
