<script lang="ts">
	import type { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
	import { getClientName } from '$lib/utils/formatter';

	interface PageProps {
		data: ApplicationTableState;
	}

	let { data }: PageProps = $props();
</script>

{#each data.rows as row}
	<Table.Row class="even:bg-muted">
		<Table.Cell>{row.application_number}</Table.Cell>
		<Table.Cell class="max-w-lg">{row.title_of_invention}</Table.Cell>
		<Table.Cell>{getClientName(row)}</Table.Cell>
		<Table.Cell class="whitespace-nowrap">{row.status}</Table.Cell>
	</Table.Row>
{/each}
