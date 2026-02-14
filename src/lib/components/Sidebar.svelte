<script module lang="ts">
	import { getContext } from 'svelte';
</script>

<script>
	import { pageTitles } from '$lib/constants/constant';
	import { resolve } from '$app/paths';

	const isSidebarOpen = getContext('isSidebarOpen');
	const isMobileOpen = getContext('isMobileOpen');
</script>

<aside class="bg-primary">
	{#each Object.entries(pageTitles) as [path, title] (path)}
		<div>
			<a href={resolve(path)}>{title}</a>
		</div>
	{/each}
</aside>
