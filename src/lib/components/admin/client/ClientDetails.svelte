<script lang="ts">
	import type { ClientProfile } from '$lib/types/DatabaseTypes';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import PhoneInput from '$lib/components/global/PhoneInput.svelte';
	import { formatDate } from '$lib/utils/formatter';
	import phoneFormats from '$lib/constants/phone_format.json';

	interface EditData {
		first_name: string;
		last_name: string;
		middle_name: string | null;
		email: string;
		mobile_number: string | null;
		nationality: string;
		company_name: string | null;
		company_address: string | null;
	}

	interface Props {
		data: ClientProfile;
		isEditing: boolean;
		editData: EditData;
		originalData: EditData;
	}

	let { data, isEditing, editData = $bindable(), originalData }: Props = $props();

	/**
	 * Parse an existing mobile_number string like "+63 912 345 6789" into
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

	const parsed = parsePhone(editData.mobile_number);
	let phoneDialCode = $state(parsed.dialCode);
	let phoneLocalNumber = $state(parsed.localNumber);

	// Sync combined value back to editData
	$effect(() => {
		if (phoneLocalNumber) {
			editData.mobile_number = `${phoneDialCode} ${phoneLocalNumber}`;
		} else {
			editData.mobile_number = null;
		}
	});

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
			'email',
			'mobile_number',
			'nationality',
			'company_name',
			'company_address'
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
					<dd class="font-medium">{data.first_name ?? '—'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Last Name</dt>
				{#if isEditing}
					<Input bind:value={editData.last_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.last_name ?? '—'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Middle Name</dt>
				{#if isEditing}
					<Input bind:value={editData.middle_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.middle_name ?? '—'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Nationality</dt>
				{#if isEditing}
					<Input bind:value={editData.nationality} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.nationality ?? '—'}</dd>
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
				{#if isEditing}
					<Input bind:value={editData.email} type="email" class="text-sm" />
				{:else}
					<dd class="font-medium">{data.email ?? '—'}</dd>
				{/if}
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Mobile Number</dt>
				{#if isEditing}
					<PhoneInput bind:value={phoneLocalNumber} bind:dialCode={phoneDialCode} />
				{:else}
					<dd class="font-medium">{data.mobile_number ?? '—'}</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Company Information -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Company Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Company Name</dt>
				{#if isEditing}
					<Input bind:value={editData.company_name} class="text-sm" />
				{:else}
					<dd class="font-medium">{data.company_name ?? '—'}</dd>
				{/if}
			</div>
			<div class="sm:col-span-2">
				<dt class="mb-1 text-xs text-muted-foreground">Company Address</dt>
				{#if isEditing}
					<textarea
						class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
						rows="2"
						bind:value={editData.company_address}
					></textarea>
				{:else}
					<dd class="font-medium">{data.company_address ?? '—'}</dd>
				{/if}
			</div>
		</dl>
	</section>

	<Separator />

	<!-- Record Information -->
	<section>
		<h3 class="mb-4 text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Record Information
		</h3>
		<dl class="grid gap-x-8 gap-y-4 text-sm sm:grid-cols-2">
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Created At</dt>
				<dd class="font-medium">{formatDate(data.created_at)}</dd>
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Last Updated</dt>
				<dd class="font-medium">{formatDate(data.updated_at)}</dd>
			</div>
			<div>
				<dt class="mb-1 text-xs text-muted-foreground">Client ID</dt>
				<dd class="font-mono text-xs font-medium break-all">{data.client_id}</dd>
			</div>
		</dl>
	</section>
</div>
