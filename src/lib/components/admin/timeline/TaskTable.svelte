<script lang="ts">
	import type { ApplicationTask } from '$lib/types/DatabaseTypes';
	import * as Collapsible from '$lib/shadcn/components/ui/collapsible/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import { ChevronDown, Circle, CircleCheck } from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { insertNotificationBatch } from '$lib/services/notification';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import { invalidate } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	interface ComponentProps {
		tasks: ApplicationTask[];
		applicationNumber: string;
		teamAssigned: string | null;
		userId: string;
	}

	let { tasks, applicationNumber, teamAssigned, userId }: ComponentProps = $props();

	let isOpen = $state(true);
	let togglingTaskId = $state<string | null>(null);

	const completedCount = $derived(tasks.filter((t) => t.is_completed).length);

	async function toggleTaskComplete(task: ApplicationTask): Promise<void> {
		if (task.is_completed || togglingTaskId) return;

		togglingTaskId = task.task_id;
		try {
			const supabase = createBrowserClient();

			const { error } = await supabase
				.schema('api')
				.from('application_tasks')
				.update({
					is_completed: true,
					completed_by: userId,
					completed_at: new Date().toISOString()
				})
				.eq('task_id', task.task_id);

			if (error) {
				toast.error(`Failed to update task: ${error.message}`);
				return;
			}

			// Notify team members
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
						title: 'Task Completed',
						message: `Task "${task.title}" was completed for application ${applicationNumber}`,
						link: `/application/timeline`
					});
				}
			}

			logAuditEvent({
				details: `[actor] completed task "${task.title}" in application ${applicationNumber}`,
				eventType: 'Completed Task'
			});

			toast.success('Task marked as complete');
			await invalidate('db:timeline');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
		} finally {
			togglingTaskId = null;
		}
	}
</script>

<Collapsible.Root bind:open={isOpen}>
	<div class="flex items-center gap-2 px-5 py-2.5">
		<Collapsible.Trigger
			class="flex cursor-pointer items-center gap-2 text-sm font-semibold transition-colors hover:text-primary"
		>
			<ChevronDown class="size-4 transition-transform duration-200 {isOpen ? '' : '-rotate-90'}" />
			Case Tasks
			<span class="text-xs font-normal text-muted-foreground">
				({completedCount}/{tasks.length})
			</span>
		</Collapsible.Trigger>
	</div>

	<Collapsible.Content>
		{#if tasks.length === 0}
			<div class="px-5 py-6 pb-4 text-center text-xs text-muted-foreground">
				No tasks yet. Click "Add Task" to create one.
			</div>
		{:else}
			<div class="px-5 pb-4">
				<Table.Root>
					<Table.Header>
						<Table.Row class="hover:bg-transparent">
							<Table.Head class="w-8 px-1"></Table.Head>
							<Table.Head class="text-xs">Title</Table.Head>
							<Table.Head class="text-right text-xs">Additional Details</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each tasks as task (task.task_id)}
							{@const isToggling = togglingTaskId === task.task_id}
							<Table.Row class="group">
								<Table.Cell class="w-8 px-1">
									<button
										class="flex items-center justify-center transition-colors disabled:opacity-50"
										onclick={() => toggleTaskComplete(task)}
										disabled={task.is_completed || isToggling}
										title={task.is_completed ? 'Completed' : 'Mark as complete'}
									>
										{#if task.is_completed}
											<CircleCheck class="size-4! text-emerald-500" />
										{:else}
											<Circle
												class="size-4! text-muted-foreground/40 transition-colors group-hover:text-primary {isToggling
													? 'animate-pulse'
													: ''}"
											/>
										{/if}
									</button>
								</Table.Cell>
								<Table.Cell class="text-xs">
									<span
										class="transition-colors"
										class:line-through={task.is_completed}
										class:text-muted-foreground={task.is_completed}
									>
										{task.title}
									</span>
								</Table.Cell>
								<Table.Cell class="text-right text-xs text-muted-foreground">
									{#if task.description}
										{#if /^(https?:\/\/)/i.test(task.description)}
											<a
												href={task.description}
												target="_blank"
												rel="noopener noreferrer"
												class="inline-block max-w-48 truncate align-bottom transition-colors hover:text-primary"
												title={task.description}
											>
												{task.description.length > 25
													? `${task.description.substring(0, 25)}...`
													: task.description}
											</a>
										{:else}
											<span
												class="inline-block max-w-48 truncate align-bottom"
												title={task.description}
											>
												{task.description}
											</span>
										{/if}
									{:else}
										N/A
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			</div>
		{/if}
	</Collapsible.Content>
</Collapsible.Root>
