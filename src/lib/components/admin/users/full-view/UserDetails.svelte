<script lang="ts">
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import PhoneInput from '$lib/components/global/PhoneInput.svelte';
	import { formatDate } from '$lib/utils/formatter';
	import phoneFormats from '$lib/constants/phone_format.json';

	interface EditData {
		first_name: string | null;
		last_name: string | null;
		middle_name: string | null;
		role: string | null;
		contact_number: string | null;
		address: string | null;
		is_active: boolean;
	}

	interface Props {
		data: UserProfile;
		isEditing: boolean;
		editData: EditData;
		originalData: EditData;
		availableRoles: string[];
	}

	let { data, isEditing, editData = $bindable(), originalData, availableRoles }: Props = $props();

	/**
	 * Parse an existing contact_number string like "+63 912 345 6789" into
	 * { dialCode, localNumber } by matching known dial codes.
	 */
	function parsePhone(raw: string | null): { dialCode: string; localNumber: string } {
		if (!raw) return { dialCode: '+63', localNumber: '' };
		const trimmed = raw.trim();
		// Try matching longest dial codes first
		const sorted = [...phoneFormats].sort((a, b) => b.dial_code.length - a.dial_code.length);
		for (const fmt of sorted) {
			if (trimmed.startsWith(fmt.dial_code)) {
				return {
					dialCode: fmt.dial_code,
					localNumber: trimmed.slice(fmt.dial_code.length).trim()
				};
			}
		}
		return { dialCode: '+63', localNumber: trimmed };
	}

	const parsed = parsePhone(editData.contact_number);
	let phoneDialCode = $state(parsed.dialCode);
	let phoneLocalNumber = $state(parsed.localNumber);

	// Sync combined value back to editData
	$effect(() => {
		if (phoneLocalNumber) {
			editData.contact_number = `${phoneDialCode} ${phoneLocalNumber}`;
		} else {
			editData.contact_number = null;
		}
	});

	// Group permissions by category
	/**
	 * Computes a JSON diff of changes between originalData and editData.
	 * Returns null if nothing changed.
	 */
	export function getChanges(): Record<string, { old: unknown; new: unknown }> | null {
		const changes: Record<string, { old: unknown; new: unknown }> = {};

		const fields: (keyof EditData)[] = [
			'first_name',
			'last_name',
			'middle_name',
			'role',
			'contact_number',
			'address',
			'is_active'
		];

		for (const field of fields) {
			const oldVal = originalData[field];
			const newVal = editData[field];
			if (String(oldVal ?? '') !== String(newVal ?? '')) {
				changes[field] = { old: oldVal ?? null, new: newVal ?? null };
			}
		}

		return Object.keys(changes).length > 0 ? changes : null;
	}
</script>

<div class="flex flex-col gap-8">
	<!-- Personal Information -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Personal Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">First Name</dt>
				{#if isEditing}
					<Input bind:value={editData.first_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.first_name ?? 'N/A'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Last Name</dt>
				{#if isEditing}
					<Input bind:value={editData.last_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.last_name ?? 'N/A'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Middle Name</dt>
				{#if isEditing}
					<Input bind:value={editData.middle_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.middle_name ?? 'N/A'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Role</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.role ?? ''}
						onchange={(e) => {
							const val = (e.target as HTMLSelectElement).value;
							editData.role = val || null;
						}}
					>
						<option value="" disabled>Select role…</option>
						{#each availableRoles as role (role)}
							<option value={role}>{role}</option>
						{/each}
					</select>
				{:else}
					<dd class="font-medium">
						{#if data.role}
							<Badge variant="outline">{data.role}</Badge>
						{:else}
							<span class="text-muted-foreground italic">No role assigned</span>
						{/if}
					</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Status</dt>
				{#if isEditing}
					<select
						class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
						value={editData.is_active ? 'active' : 'archived'}
						onchange={(e) => {
							editData.is_active = (e.target as HTMLSelectElement).value === 'active';
						}}
					>
						<option value="active">Active</option>
						<option value="archived">Archived</option>
					</select>
				{:else}
					<dd>
						{#if data.is_active}
							<Badge variant="default" class="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
						{:else}
							<Badge variant="secondary">Archived</Badge>
						{/if}
					</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Contact Details -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Contact Details
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Email</dt>
				<dd class="font-medium">{data.email ?? 'N/A'}</dd>
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Contact Number</dt>
				{#if isEditing}
					<PhoneInput bind:value={phoneLocalNumber} bind:dialCode={phoneDialCode} />
				{:else}
					<dd class="font-medium">{data.contact_number ?? 'N/A'}</dd>
				{/if}
			</div>
			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Address</dt>
				{#if isEditing}
					<textarea
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						rows="2"
						bind:value={editData.address}
					></textarea>
				{:else}
					<dd class="font-medium">{data.address ?? 'N/A'}</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Account Information -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Account Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Created At</dt>
				<dd class="font-medium">{formatDate(data.created_at)}</dd>
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">User ID</dt>
				<dd class="font-mono text-xs font-medium break-all">{data.user_id}</dd>
			</div>
		</dl>
	</section>
</div>
