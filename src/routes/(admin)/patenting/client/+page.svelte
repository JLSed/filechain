<script lang="ts">
	import { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import ApplicationTableRow from '$lib/components/admin/patenting-client/ApplicationTableRow.svelte';
	let { data }: PageProps = $props();

	const table = new ApplicationTableState(data.applications);
</script>

<main>
	<h1>Client Applications</h1>
	<div class="p-2">
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head>Application #</Table.Head>
					<Table.Head>Title of Invention</Table.Head>
					<Table.Head>Client</Table.Head>
					<Table.Head>Status</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#if table.totalRows === 0}
					<Table.Row>
						<Table.Cell colspan={8} class="py-12 text-center text-muted-foreground">
							No applications found.
						</Table.Cell>
					</Table.Row>
				{:else}
					{#each table.rows as row}
						<ApplicationTableRow data={row} />
					{/each}
				{/if}
			</Table.Body>
		</Table.Root>
	</div>
</main>
