<script lang="ts">
	import type { ClientProfile } from '$lib/types/DatabaseTypes';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import { Folder, Ellipsis, User, Pencil, Archive, Building2 } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	interface Props {
		client: ClientProfile;
	}

	let { client }: Props = $props();

	const fullName = $derived(
		[client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ')
	);

	const isCompany = $derived(client.company_name && !client.is_individual);
	const clientName = $derived(isCompany ? client.company_name : fullName);

	function handleViewClient(): void {
		goto(`/client/${client.client_id}`);
	}

	function handleEditDetails(): void {
		goto(`/client/${client.client_id}?edit=true`);
	}
</script>

<a
	href="/files/{client.client_id}"
	class="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
>
	{#if isCompany}
		<Building2
			class="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
		/>
	{:else}
		<Folder class="size-5 shrink-0 fill-current text-foreground" />
	{/if}
	<span class="min-w-0 flex-1 truncate text-sm font-medium">{clientName}</span>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<button class="rounded-md p-1 transition-opacity hover:bg-muted" aria-label="More options">
					<Ellipsis class="size-4" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item onclick={handleViewClient}><User /> View Client</DropdownMenu.Item>
				<DropdownMenu.Item onclick={handleEditDetails}><Pencil /> Edit Details</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="text-destructive"><Archive /> Archive</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</a>
