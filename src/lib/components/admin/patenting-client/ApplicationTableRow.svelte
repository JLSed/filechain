<script lang="ts">
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
	import { getClientName } from '$lib/utils/formatter';
	import { Archive, Edit, Eye, FolderOpen } from '@lucide/svelte';

	interface PageProps {
		app: IpApplication;
		openDetails: (app: IpApplication) => void;
	}

	let { app, openDetails }: PageProps = $props();
</script>

<DropdownMenu.Root>
	<DropdownMenu.Trigger>
		{#snippet child({ props })}
			<Table.Row {...props} class="cursor-pointer even:bg-muted"
				><Table.Cell>{app.application_number}</Table.Cell>
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
			</Table.Row>
		{/snippet}
	</DropdownMenu.Trigger>
	<DropdownMenu.Content>
		<DropdownMenu.Item onclick={() => openDetails(app)}><Eye /> View Details</DropdownMenu.Item>
		<DropdownMenu.Item><FolderOpen /> View Files</DropdownMenu.Item>
		<DropdownMenu.Item><Edit /> Edit Application</DropdownMenu.Item>
		<DropdownMenu.Separator />
		<DropdownMenu.Item variant="destructive"><Archive />Archive Application</DropdownMenu.Item>
	</DropdownMenu.Content>
</DropdownMenu.Root>
