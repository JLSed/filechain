<script>
	import { getContext } from 'svelte';

	const isCollapsed = getContext('isCollapsed');
	const isMobileOpen = getContext('isMobileOpen');
</script>

<aside class="bg-primary">
	<button onclick={() => ($isCollapsed = !$isCollapsed)}>{$isCollapsed} test</button>
</aside>
