<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const { children } = $props();

	const isSidebarOpen = writable(false);
	setContext('isSidebarOpen', isSidebarOpen);
	const isMobileOpen = writable(false);
	setContext('isMobileOpen', isMobileOpen);
</script>

<div>
	{@render children()}
</div>
