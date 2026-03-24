<script lang="ts">
	import type { ApplicationTask, IpApplication } from '$lib/types/DatabaseTypes';
	import StatusPipeline from './StatusPipeline.svelte';
	import TaskTable from './TaskTable.svelte';
	import AddTaskDialog from './AddTaskDialog.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import { Eye, Maximize2, Clock, Users, CalendarPlus } from '@lucide/svelte';
	import { formatDate, getDaysLeft } from '$lib/utils/formatter';

	interface ComponentProps {
		application: IpApplication;
		tasks: ApplicationTask[];
		userId: string;
	}

	let { application, tasks, userId }: ComponentProps = $props();

	let addDialogOpen = $state(false);

	const daysLeft = $derived(getDaysLeft(application.deadline));
</script>

<div class="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
	<!-- Card Header: Title + Deadline + Team -->
	<div class="flex items-start justify-between gap-4 p-5 pb-3">
		<h3 class="min-w-0 truncate text-lg leading-snug font-semibold">
			{application.title_of_invention}
		</h3>

		<div class="flex shrink-0 items-center gap-2">
			<!-- Deadline Pill -->
			{#if application.deadline}
				<div
					class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs {daysLeft ===
					'Overdue'
						? 'border-destructive/30 text-destructive'
						: ''}"
				>
					<Clock class="size-3.5! shrink-0" />
					<div class="flex flex-col leading-tight">
						<span class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
							Deadline
						</span>
						<span class="font-semibold">{formatDate(application.deadline)}</span>
						{#if daysLeft}
							<span
								class="mt-0.5 text-[10px]"
								class:text-destructive={daysLeft === 'Overdue'}
								class:text-amber-600={daysLeft === 'Due Today'}
								class:dark:text-amber-400={daysLeft === 'Due Today'}
								class:text-muted-foreground={daysLeft !== 'Overdue' && daysLeft !== 'Due Today'}
							>
								{daysLeft}
							</span>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Team Pill -->
			{#if application.team_assigned}
				<div class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs">
					<Users class="size-3.5! shrink-0" />
					<div class="flex flex-col leading-tight">
						<span class="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
							Team Assigned
						</span>
						<span class="font-semibold">{application.team_assigned}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>

	<!-- Status Pipeline -->
	<div class="px-5">
		<StatusPipeline currentStatus={application.status} />
	</div>

	<Separator />

	<!-- Action Bar -->
	<div class="flex flex-wrap items-center gap-2 px-5 py-2.5">
		<Badge variant="outline" class="font-mono text-xs">
			{application.application_number}
		</Badge>
		<Button variant="outline" size="sm" class="h-7 gap-1.5 text-xs" title="Quick View">
			<Eye class="size-3.5!" />
			Quick View
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-7 gap-1.5 text-xs"
			href="/application/{application.application_number}"
			title="Full View"
		>
			<Maximize2 class="size-3.5!" />
			Full View
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-7 gap-1.5 text-xs"
			onclick={() => (addDialogOpen = true)}
		>
			<CalendarPlus class="size-3.5!" />
			Add Task
		</Button>
	</div>

	<Separator />

	<!-- Tasks Section -->
	<TaskTable
		{tasks}
		applicationNumber={application.application_number}
		teamAssigned={application.team_assigned}
		{userId}
	/>
</div>

<AddTaskDialog
	bind:open={addDialogOpen}
	applicationNumber={application.application_number}
	teamAssigned={application.team_assigned}
	{userId}
/>
