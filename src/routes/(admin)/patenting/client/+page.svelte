<script lang="ts">
	import { ApplicationTableState } from '$lib/classes/TableClass.svelte';
	import type { PageProps } from './$types';

	let { data }: PageProps = $props();

	const table = new ApplicationTableState(data.applications);

	console.log(table.pageNumbers);
	console.log(table.totalRows);
</script>
