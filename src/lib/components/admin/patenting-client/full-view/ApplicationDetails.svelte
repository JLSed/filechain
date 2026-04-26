<script lang="ts">
	import type {
		IpApplication,
		TypeOfInvention,
		PreProtectionStatus,
		TypeOfOfficeAction
	} from '$lib/types/DatabaseTypes';
	import { TEAM_ROLES } from '$lib/constants/SchemaData';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Calendar from '$lib/shadcn/components/ui/calendar/calendar.svelte';
	import * as Popover from '$lib/shadcn/components/ui/popover/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { CalendarIcon } from '@lucide/svelte';
	import { formatDate } from '$lib/utils/formatter';
	import {
		type DateValue,
		CalendarDate,
		getLocalTimeZone,
		DateFormatter
	} from '@internationalized/date';

	interface EditData {
		application_number: string;
		title_of_invention: string;
		type_of_invention_id: number | null;
		pre_protection_status_id: number | null;
		type_of_office_action_id: number | null;
		team_assigned: string | null;
		inventor_names: string;
		contact_details: string;
		filling_date: string | null;
		deadline: string | null;
		mailing_date: string | null;
		publication_date: string | null;
		paper_document_no: string;
		fees: number | null;
		remarks: string;
	}

	interface Props {
		data: IpApplication;
		isEditing: boolean;
		inventionTypes: TypeOfInvention[];
		protectionStatuses: PreProtectionStatus[];
		officeActions: TypeOfOfficeAction[];
		editData: EditData;
		originalData: EditData;
	}

	let {
		data,
		isEditing,
		inventionTypes,
		protectionStatuses,
		officeActions,
		editData = $bindable(),
		originalData
	}: Props = $props();

	const df = new DateFormatter('en-US', { dateStyle: 'long' });

	// --- Resolve lookup ID to display name ---
	function resolveInventionName(id: number | null): string | null {
		if (id == null) return null;
		return inventionTypes.find((t) => t?.id === id)?.name ?? null;
	}

	function resolveProtectionName(id: number | null): string | null {
		if (id == null) return null;
		return protectionStatuses.find((s) => s?.id === id)?.name ?? null;
	}

	function resolveOfficeActionName(id: number | null): string | null {
		if (id == null) return null;
		return officeActions.find((a) => a?.id === id)?.name ?? null;
	}

	/**
	 * Computes a JSON diff of changes between originalData and editData.
	 * Returns null if nothing changed.
	 */
	export function getChanges(): Record<string, { old: unknown; new: unknown }> | null {
		const changes: Record<string, { old: unknown; new: unknown }> = {};

		// Simple string/number/null fields
		const simpleFields: (keyof EditData)[] = [
			'application_number',
			'title_of_invention',
			'inventor_names',
			'contact_details',
			'filling_date',
			'deadline',
			'mailing_date',
			'publication_date',
			'paper_document_no',
			'fees',
			'remarks'
		];

		for (const field of simpleFields) {
			const oldVal = originalData[field];
			const newVal = editData[field];
			if (String(oldVal ?? '') !== String(newVal ?? '')) {
				changes[field] = { old: oldVal || null, new: newVal || null };
			}
		}

		// Lookup fields — resolve IDs to human-readable names
		if (originalData.type_of_invention_id !== editData.type_of_invention_id) {
			changes['type_of_invention'] = {
				old: resolveInventionName(originalData.type_of_invention_id),
				new: resolveInventionName(editData.type_of_invention_id)
			};
		}

		if (originalData.pre_protection_status_id !== editData.pre_protection_status_id) {
			changes['pre_protection_status'] = {
				old: resolveProtectionName(originalData.pre_protection_status_id),
				new: resolveProtectionName(editData.pre_protection_status_id)
			};
		}

		if (originalData.type_of_office_action_id !== editData.type_of_office_action_id) {
			changes['type_of_office_action'] = {
				old: resolveOfficeActionName(originalData.type_of_office_action_id),
				new: resolveOfficeActionName(editData.type_of_office_action_id)
			};
		}

		if (originalData.team_assigned !== editData.team_assigned) {
			changes['team_assigned'] = {
				old: originalData.team_assigned,
				new: editData.team_assigned
			};
		}

		return Object.keys(changes).length > 0 ? changes : null;
	}

	// --- Date helpers ---
	function toCalendarDate(dateStr: string | null | undefined): CalendarDate | undefined {
		if (!dateStr) return undefined;
		const [y, m, d] = dateStr.split('-').map(Number);
		if (!y || !m || !d) return undefined;
		return new CalendarDate(y, m, d);
	}

	function fromCalendarDate(val: DateValue | undefined): string | null {
		if (!val) return null;
		const date = val.toDate(getLocalTimeZone());
		const y = date.getFullYear();
		const m = String(date.getMonth() + 1).padStart(2, '0');
		const d = String(date.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	let fillingDateValue = $derived(toCalendarDate(editData.filling_date));
	let deadlineValue = $derived(toCalendarDate(editData.deadline));
	let mailingDateValue = $derived(toCalendarDate(editData.mailing_date));
	let publicationDateValue = $derived(toCalendarDate(editData.publication_date));

	let fillingDateOpen = $state(false);
	let deadlineOpen = $state(false);
	let mailingDateOpen = $state(false);
	let publicationDateOpen = $state(false);

	function formatCalendarDate(val: DateValue | undefined): string {
		if (!val) return 'Select date';
		return df.format(val.toDate(getLocalTimeZone()));
	}
</script>

<div class="flex flex-col gap-8">
	<!-- Invention Section -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Invention
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Title of Invention</dt>
				{#if isEditing}
					<Input bind:value={editData.title_of_invention} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.title_of_invention}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Application Number</dt>
				{#if isEditing}
					<Input
						bind:value={editData.application_number}
						placeholder="Enter application number"
						class="font-mono text-sm"
					/>
				{:else}
					<dd class="font-medium">
						{#if data.application_number}
							<Badge variant="outline" class="font-mono text-xs">{data.application_number}</Badge>
						{:else}
							<span class="text-muted-foreground italic">Not assigned</span>
						{/if}
					</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Status</dt>
				<dd>
					<Badge variant="secondary" class="text-xs">{data.status}</Badge>
				</dd>
			</div>

			<!-- Type of Invention -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Type of Invention</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.type_of_invention_id ?? 0}
						onchange={(e) => {
							const val = Number((e.target as HTMLSelectElement).value);
							editData.type_of_invention_id = val || null;
						}}
					>
						<option value={0} disabled>Select type…</option>
						{#each inventionTypes.filter(Boolean) as type (type!.id)}
							<option value={type!.id}>{type!.name}</option>
						{/each}
					</select>
				{:else}
					<dd class="font-medium">{data.type_of_invention?.name ?? '—'}</dd>
				{/if}
			</div>

			<!-- Pre-Protection Status -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Pre-Protection Status</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.pre_protection_status_id ?? 0}
						onchange={(e) => {
							const val = Number((e.target as HTMLSelectElement).value);
							editData.pre_protection_status_id = val || null;
						}}
					>
						<option value={0} disabled>Select status…</option>
						{#each protectionStatuses.filter(Boolean) as status (status!.id)}
							<option value={status!.id}>{status!.name}</option>
						{/each}
					</select>
				{:else}
					<dd class="font-medium">{data.pre_protection_status?.name ?? '—'}</dd>
				{/if}
			</div>

			<!-- Office Action -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Office Action</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.type_of_office_action_id ?? 0}
						onchange={(e) => {
							const val = Number((e.target as HTMLSelectElement).value);
							editData.type_of_office_action_id = val || null;
						}}
					>
						<option value={0} disabled>Select action…</option>
						{#each officeActions.filter(Boolean) as action (action!.id)}
							<option value={action!.id}>{action!.name}</option>
						{/each}
					</select>
				{:else}
					<dd class="font-medium">{data.type_of_office_action?.name ?? '—'}</dd>
				{/if}
			</div>

			<!-- Team Assigned -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Team Assigned</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.team_assigned ?? ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							editData.team_assigned = val || null;
						}}
					>
						<option value="" disabled>Select team…</option>
						{#each TEAM_ROLES as team (team)}
							<option value={team}>{team}</option>
						{/each}
					</select>
				{:else}
					<dd class="font-medium">{data.team_assigned ?? '—'}</dd>
				{/if}
			</div>

			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Inventor(s)</dt>
				{#if isEditing}
					<Input
						bind:value={editData.inventor_names}
						placeholder="Comma-separated names"
						class="text-sm"
					/>
				{:else}
					<dd class="font-medium">
						{#if data.inventor_names && data.inventor_names.length > 0}
							{data.inventor_names.join(', ')}
						{:else}
							—
						{/if}
					</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Client Section -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Client Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Name</dt>
				<dd class="font-medium">
					{data.client_profiles?.first_name ?? '—'}
					{data.client_profiles?.last_name ?? ''}
				</dd>
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Email</dt>
				<dd class="font-medium">{data.client_profiles?.email ?? '—'}</dd>
			</div>
			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Contact Details</dt>
				{#if isEditing}
					<Input bind:value={editData.contact_details} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.contact_details ?? '—'}</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Dates & Deadlines -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Dates & Deadlines
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
			<!-- Filing Date -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Filing Date</dt>
				{#if isEditing}
					<Popover.Root bind:open={fillingDateOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-start text-start text-sm font-normal {!fillingDateValue
										? 'text-muted-foreground'
										: ''}"
									{...props}
								>
									<CalendarIcon class="me-2 size-4" />
									{formatCalendarDate(fillingDateValue)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								value={fillingDateValue}
								onValueChange={(val) => {
									editData.filling_date = fromCalendarDate(val);
									fillingDateOpen = false;
								}}
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<dd class="font-medium">{formatDate(data.filling_date)}</dd>
				{/if}
			</div>

			<!-- Deadline -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Deadline</dt>
				{#if isEditing}
					<Popover.Root bind:open={deadlineOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-start text-start text-sm font-normal {!deadlineValue
										? 'text-muted-foreground'
										: ''}"
									{...props}
								>
									<CalendarIcon class="me-2 size-4" />
									{formatCalendarDate(deadlineValue)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								value={deadlineValue}
								onValueChange={(val) => {
									editData.deadline = fromCalendarDate(val);
									deadlineOpen = false;
								}}
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<dd class="font-medium">{formatDate(data.deadline)}</dd>
				{/if}
			</div>

			<!-- Mailing Date -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Mailing Date</dt>
				{#if isEditing}
					<Popover.Root bind:open={mailingDateOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-start text-start text-sm font-normal {!mailingDateValue
										? 'text-muted-foreground'
										: ''}"
									{...props}
								>
									<CalendarIcon class="me-2 size-4" />
									{formatCalendarDate(mailingDateValue)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								value={mailingDateValue}
								onValueChange={(val) => {
									editData.mailing_date = fromCalendarDate(val);
									mailingDateOpen = false;
								}}
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<dd class="font-medium">{formatDate(data.mailing_date)}</dd>
				{/if}
			</div>

			<!-- Publication Date -->
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Publication Date</dt>
				{#if isEditing}
					<Popover.Root bind:open={publicationDateOpen}>
						<Popover.Trigger>
							{#snippet child({ props })}
								<Button
									variant="outline"
									class="w-full justify-start text-start text-sm font-normal {!publicationDateValue
										? 'text-muted-foreground'
										: ''}"
									{...props}
								>
									<CalendarIcon class="me-2 size-4" />
									{formatCalendarDate(publicationDateValue)}
								</Button>
							{/snippet}
						</Popover.Trigger>
						<Popover.Content class="w-auto overflow-hidden p-0" align="start">
							<Calendar
								type="single"
								value={publicationDateValue}
								onValueChange={(val) => {
									editData.publication_date = fromCalendarDate(val);
									publicationDateOpen = false;
								}}
								captionLayout="dropdown"
							/>
						</Popover.Content>
					</Popover.Root>
				{:else}
					<dd class="font-medium">{formatDate(data.publication_date)}</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Additional Info -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Additional Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Paper Document No.</dt>
				{#if isEditing}
					<Input bind:value={editData.paper_document_no} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.paper_document_no ?? '—'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">IPOPHL Fees</dt>
				{#if isEditing}
					<Input
						type="number"
						value={editData.fees ?? ''}
						oninput={(e) => {
							const val = (e.target as HTMLInputElement).value;
							editData.fees = val ? Number(val) : null;
						}}
						class="text-sm"
					/>
				{:else}
					<dd class="font-medium">{data.fees != null ? `₱${data.fees.toLocaleString()}` : '—'}</dd>
				{/if}
			</div>
			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Remarks</dt>
				{#if isEditing}
					<textarea
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						rows="3"
						bind:value={editData.remarks}
					></textarea>
				{:else}
					<dd class="font-medium whitespace-pre-wrap">{data.remarks ?? '—'}</dd>
				{/if}
			</div>
		</dl>
	</section>
</div>
