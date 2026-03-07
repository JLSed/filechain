<script lang="ts">
	import type { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import * as ContextMenu from '$lib/shadcn/components/ui/context-menu/index.js';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
	import { getClientName } from '$lib/utils/formatter';

	interface PageProps {
		data: IpApplication;
	}

	let { data }: PageProps = $props();
</script>

<Table.Row class="even:bg-muted">
	<ContextMenu.Root>
		<ContextMenu.Trigger>
			<Table.Cell>{data.application_number}</Table.Cell>
			<Table.Cell class="max-w-lg">{data.title_of_invention}</Table.Cell>
			<Table.Cell>{getClientName(data)}</Table.Cell>
			<Table.Cell class="whitespace-nowrap">{data.status}</Table.Cell>
		</ContextMenu.Trigger>
		<ContextMenu.Content>
			<ContextMenu.Item>View Details</ContextMenu.Item>
			<ContextMenu.Item>View Files</ContextMenu.Item>
			<ContextMenu.Item>Delete</ContextMenu.Item>
		</ContextMenu.Content>
	</ContextMenu.Root>
</Table.Row>
