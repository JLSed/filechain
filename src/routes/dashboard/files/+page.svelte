<script lang="ts">
	import FileViewer from '$lib/components/FileViewer.svelte';

	let { data } = $props();
</script>

<div class="space-y-6 p-4">
	<FileViewer files={data.files} />
</div>
