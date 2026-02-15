<script lang="ts">
	import LatestUploadsTable from '$lib/components/LatestUploadsTable.svelte';

	let { data } = $props();
</script>

<div class="space-y-6 p-6">
	<div>
		<h1 class="text-3xl font-bold text-foreground">Dashboard</h1>
		<p class="mt-2 text-muted-foreground">Overview of your recent file uploads</p>
	</div>

	<LatestUploadsTable files={data.files} profile={data.profile} />
</div>
