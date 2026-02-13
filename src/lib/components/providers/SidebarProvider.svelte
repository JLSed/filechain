<script lang="ts">
	import { setContext } from 'svelte';
	import { writable } from 'svelte/store';

	const { children } = $props();

	const isCollapsed = writable(false);
	setContext('isCollapsed', isCollapsed);
	const isMobileOpen = writable(false);
	setContext('isMobileOpen', isMobileOpen);
</script>

<div>
	{@render children()}
</div>
