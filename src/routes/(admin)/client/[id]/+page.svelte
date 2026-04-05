<script lang="ts">
	import type { PageProps } from './$types';
	import ClientDetails from '$lib/components/admin/client/ClientDetails.svelte';
	import ClientActionPanel from '$lib/components/admin/client/ClientActionPanel.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { deserialize } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { page } from '$app/stores';

	let { data }: PageProps = $props();

	const client = $derived(data.client);
	const displayName = $derived(
		[client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ') || '—'
	);

	// Edit state — initialise from ?edit=true query param
	let isEditing = $state($page.url.searchParams.get('edit') === 'true');
	let saving = $state(false);

	/** Build a fresh editData snapshot from the current client. */
	function buildEditData() {
		return {
			first_name: client.first_name,
			last_name: client.last_name,
			middle_name: client.middle_name,
			email: client.email,
			mobile_number: client.mobile_number,
			nationality: client.nationality,
			company_name: client.company_name,
			company_address: client.company_address
		};
	}

	let editData = $state(buildEditData());
	let originalData = $state(buildEditData());

	// Component ref for calling getChanges()
	let detailsRef: ReturnType<typeof ClientDetails> | undefined = $state();

	function toggleEdit(): void {
		if (!isEditing) {
			// Entering edit mode: snapshot current data
			editData = buildEditData();
			originalData = buildEditData();
		}
		isEditing = !isEditing;
	}

	async function handleSave(): Promise<void> {
		saving = true;
		try {
			const updatePayload: Record<string, unknown> = {
				first_name: editData.first_name || null,
				last_name: editData.last_name || null,
				middle_name: editData.middle_name || null,
				email: editData.email || null,
				mobile_number: editData.mobile_number || null,
				nationality: editData.nationality || null,
				company_name: editData.company_name || null,
				company_address: editData.company_address || null
			};

			// Compute changes diff from the ClientDetails component
			const changes = detailsRef?.getChanges() ?? null;

			// Submit to server action for DB update + audit logging
			const formData = new FormData();
			formData.set('client_id', client.client_id);
			formData.set('payload', JSON.stringify(updatePayload));
			if (changes) {
				formData.set('changes', JSON.stringify(changes));
			}

			const response = await fetch('?/saveClient', {
				method: 'POST',
				body: formData
			});

			const result = deserialize(await response.text());

			if (result.type === 'failure') {
				const message = (result.data as { message?: string })?.message ?? 'Failed to save.';
				toast.error(message);
				return;
			}

			if (result.type === 'error') {
				toast.error(result.error?.message ?? 'An unexpected error occurred.');
				return;
			}

			toast.success('Client updated successfully.');
			isEditing = false;
			await invalidate('db:client-detail');
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
			);
		} finally {
			saving = false;
		}
	}
</script>

<main class="p-4 lg:p-6">
	<!-- Header -->
	<div class="mb-6 flex items-center gap-3">
		<Button variant="outline" size="icon" href="/files">
			<ArrowLeft class="size-4" />
		</Button>
		<div class="flex-1">
			<h1 class="text-lg font-semibold">{displayName}</h1>
			<div class="mt-0.5 flex items-center gap-2">
				<span class="text-sm text-muted-foreground">{client.email ?? '—'}</span>
				{#if client.company_name}
					<span class="text-muted-foreground/40">·</span>
					<span class="text-sm text-muted-foreground">{client.company_name}</span>
				{/if}
			</div>
		</div>
	</div>

	<!-- Main layout: content + action panel -->
	<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
		<!-- Left: Details -->
		<div class="min-w-0 flex-1">
			<div class="rounded-lg border bg-background p-6">
				<ClientDetails
					bind:this={detailsRef}
					data={client}
					{isEditing}
					bind:editData
					{originalData}
				/>
			</div>
		</div>

		<!-- Right: Action Panel -->
		<ClientActionPanel {isEditing} {saving} ontoggleedit={toggleEdit} onsave={handleSave} />
	</div>
</main>
