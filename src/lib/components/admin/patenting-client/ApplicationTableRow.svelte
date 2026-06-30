<script lang="ts">
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
	import { getClientName, formatDate } from '$lib/utils/formatter';
	import { Archive, Edit, Eye, FolderOpen } from '@lucide/svelte';
	import { goto } from '$app/navigation';

	interface PageProps {
		app: IpApplication;
		canEdit?: boolean;
		canArchive?: boolean;
		openDetails: (app: IpApplication) => void;
		onarchive?: (app: IpApplication) => void;
	}

	let { app, canEdit = true, canArchive = false, openDetails, onarchive }: PageProps = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Table.Row {...props} class="cursor-pointer even:bg-muted"
				><Table.Cell>{app.application_number ?? 'N/A'}</Table.Cell>
				<Table.Cell class="max-w-lg min-w-md">
					<div class="flex flex-col">
						<span class="font-medium">
							{app.title_of_invention}
						</span>
						<span class="text-xs">{app.type_of_invention?.name}</span>
					</div>
				</Table.Cell>
				<Table.Cell>{getClientName(app)}</Table.Cell>
				<Table.Cell class="whitespace-nowrap">{app.status}</Table.Cell>
				<Table.Cell class="whitespace-nowrap">{formatDate(app.created_at)}</Table.Cell>
			</Table.Row>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onclick={() => openDetails(app)}><Eye /> Quick View</DropdownMenu.Item>
		<DropdownMenu.Item onclick={() => goto(`/application/${app.application_id}`)}
			><FolderOpen /> View Application</DropdownMenu.Item
		>
		<DropdownMenu.Item
			disabled={!canEdit}
			onclick={() => goto(`/application/${app.application_id}?edit=true`)}
			><Edit /> Edit Application</DropdownMenu.Item
		>
		<DropdownMenu.Separator />
		<DropdownMenu.Item variant="destructive" disabled={!canArchive} onclick={() => onarchive?.(app)}
			><Archive /> Archive Application</DropdownMenu.Item
		>
	</DropdownMenu.Content>
</DropdownMenu.Root>
