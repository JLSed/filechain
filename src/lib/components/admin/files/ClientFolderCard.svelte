<script lang="ts">
	import type { ClientProfile } from '$lib/types/DatabaseTypes';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import { Folder, Ellipsis } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	interface Props {
		client: ClientProfile;
	}

	let { client }: Props = $props();

	const fullName = $derived(
		[client.first_name, client.middle_name, client.last_name].filter(Boolean).join(' ')
	);
</script>

<button
	type="button"
	onclick={() => goto(`/files/${client.client_id}`)}
	class="group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left transition-colors hover:bg-accent"
>
	<Folder class="size-5 shrink-0 fill-current text-foreground" />
	<span class="min-w-0 flex-1 truncate text-sm font-medium">{fullName}</span>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={(e) => e.stopPropagation()} onkeydown={(e) => e.stopPropagation()}>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<button
					class="rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-muted"
					aria-label="More options"
				>
					<Ellipsis class="size-4" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item>View Client</DropdownMenu.Item>
				<DropdownMenu.Item>Edit Details</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item class="text-destructive">Archieve</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</div>
</button>
