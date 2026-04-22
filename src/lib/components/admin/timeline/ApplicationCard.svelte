<script lang="ts">
	import type { ApplicationTask, IpApplication } from '$lib/types/DatabaseTypes';
	import { APPLICATION_STATUS } from '$lib/constants/SchemaData';
	import StatusPipeline from './StatusPipeline.svelte';
	import TaskTable from './TaskTable.svelte';
	import AddTaskDialog from './AddTaskDialog.svelte';
	import ApplicationSheet from '$lib/components/admin/patenting-client/ApplicationSheet.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import { Eye, Maximize2, Clock, Users, CalendarPlus, ArrowUpDown, X, Edit } from '@lucide/svelte';
	import { formatDate, getDaysLeft } from '$lib/utils/formatter';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import { invalidate } from '$app/navigation';
	import { toast } from 'svelte-sonner';

	interface ComponentProps {
		application: IpApplication;
		tasks: ApplicationTask[];
		userId: string;
	}

	let { application, tasks, userId }: ComponentProps = $props();

	let addDialogOpen = $state(false);
	let sheetOpen = $state(false);
	let statusDropdownOpen = $state(false);
	let updatingStatus = $state(false);

	let editingRemarks = $state(false);
	let draftRemarks = $state('');
	let savingRemarks = $state(false);

	const daysLeft = $derived(getDaysLeft(application.deadline));

	async function handleStatusChange(newStatus: string): Promise<void> {
		if (newStatus === application.status) {
			statusDropdownOpen = false;
			return;
		}

		updatingStatus = true;
		try {
			const supabase = createBrowserClient();
			const { error } = await supabase
				.schema('api')
				.from('ip_applications')
				.update({ status: newStatus })
				.eq('application_id', application.application_id);

			if (error) {
				toast.error(`Failed to update status: ${error.message}`);
				return;
			}

			toast.success(`Status updated to "${newStatus}"`);
			statusDropdownOpen = false;

			logAuditEvent({
				details: `[actor] updated status of application ${application.application_number ?? application.application_id}`,
				eventType: 'Updated Status',
				changes: {
					status: { old: application.status, new: newStatus }
				}
			});

			await invalidate('db:timeline');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
		} finally {
			updatingStatus = false;
		}
	}

	async function handleSaveRemarks(): Promise<void> {
		if (draftRemarks === (application.remarks ?? '')) {
			editingRemarks = false;
			return;
		}

		savingRemarks = true;
		try {
			const supabase = createBrowserClient();
			const { error } = await supabase
				.schema('api')
				.from('ip_applications')
				.update({ remarks: draftRemarks })
				.eq('application_id', application.application_id);

			if (error) {
				toast.error(`Failed to update remarks: ${error.message}`);
				return;
			}

			toast.success('Remarks updated');

			logAuditEvent({
				details: `[actor] edited remarks of application ${application.application_number ?? application.application_id}`,
				eventType: 'Edited Remarks',
				changes: {
					remarks: { old: application.remarks ?? '', new: draftRemarks }
				}
			});

			application.remarks = draftRemarks;
			editingRemarks = false;
			await invalidate('db:timeline');
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'An unexpected error occurred.');
		} finally {
			savingRemarks = false;
		}
	}
</script>

<div class="rounded-xl border bg-card shadow-sm transition-shadow hover:shadow-md">
	<!-- Card Header: Title + Deadline + Team -->
	<div class="flex items-start justify-between gap-4 p-5 pb-3">
		<h3 class="min-w-0 truncate text-lg leading-snug font-semibold">
			{application.title_of_invention}
		</h3>

		<div class="flex shrink-0 items-center gap-2">
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
		</div>
	</div>

	<!-- Status Pipeline -->
	<div class="px-5">
		<StatusPipeline currentStatus={application.status} />
	</div>

	<!-- Remarks Section -->
	<div class="mt-4 mb-4 px-5">
		<div class="mb-2">
			<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">Remarks</h4>
		</div>

		{#if editingRemarks}
			<textarea
				bind:value={draftRemarks}
				class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
				placeholder="Add remarks..."
				disabled={savingRemarks}
			></textarea>
		{:else if application.remarks}
			<p class="text-sm whitespace-pre-wrap">{application.remarks}</p>
		{:else}
			<p class="text-sm text-muted-foreground italic">No remarks provided.</p>
		{/if}
	</div>

	<Separator />

	<!-- Action Bar -->
	<div class="flex flex-wrap items-center gap-2 px-5 py-2.5">
		<Badge variant="outline" class="font-mono text-xs">
			{application.application_number ?? '—'}
		</Badge>
		<Button
			variant="outline"
			size="sm"
			class="h-7 gap-1.5 text-xs"
			title="Quick View"
			onclick={() => (sheetOpen = true)}
		>
			<Eye class="size-3.5!" />
			Quick View
		</Button>
		<Button
			variant="outline"
			size="sm"
			class="h-7 gap-1.5 text-xs"
			href="/application/{application.application_id}"
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

		<!-- Update Status: Button or Inline Dropdown -->
		{#if statusDropdownOpen}
			<div class="flex items-center gap-1.5">
				<select
					class="h-7 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
					value={application.status}
					disabled={updatingStatus}
					onchange={(e) => handleStatusChange((e.target as HTMLSelectElement).value)}
				>
					{#each APPLICATION_STATUS as status (status)}
						<option value={status}>{status}</option>
					{/each}
				</select>
				<Button
					variant="ghost"
					size="sm"
					class="h-7 w-7 p-0"
					title="Cancel"
					disabled={updatingStatus}
					onclick={() => (statusDropdownOpen = false)}
				>
					<X class="size-3.5!" />
				</Button>
			</div>
		{:else}
			<Button
				variant="outline"
				size="sm"
				class="h-7 gap-1.5 text-xs"
				onclick={() => (statusDropdownOpen = true)}
			>
				<ArrowUpDown class="size-3.5!" />
				Update Status
			</Button>
		{/if}

		{#if editingRemarks}
			<div class="flex items-center gap-1.5">
				<Button
					variant="outline"
					size="sm"
					class="h-7 gap-1.5 text-xs"
					disabled={savingRemarks}
					onclick={handleSaveRemarks}
				>
					{savingRemarks ? 'Saving...' : 'Save Remark'}
				</Button>
				<Button
					variant="ghost"
					size="sm"
					class="h-7 w-7 p-0"
					title="Cancel"
					disabled={savingRemarks}
					onclick={() => {
						editingRemarks = false;
						draftRemarks = application.remarks ?? '';
					}}
				>
					<X class="size-3.5!" />
				</Button>
			</div>
		{:else}
			<Button
				variant="outline"
				size="sm"
				class="h-7 gap-1.5 text-xs"
				onclick={() => {
					draftRemarks = application.remarks ?? '';
					editingRemarks = true;
				}}
			>
				<Edit class="size-3.5!" />
				Edit Remarks
			</Button>
		{/if}
	</div>

	<Separator />

	<!-- Tasks Section -->
	<TaskTable
		{tasks}
		applicationNumber={application.application_id}
		teamAssigned={application.team_assigned}
		{userId}
	/>
</div>

<AddTaskDialog
	bind:open={addDialogOpen}
	applicationNumber={application.application_id}
	teamAssigned={application.team_assigned}
	{userId}
/>

<ApplicationSheet data={application} bind:sheetOpen />
