<script module lang="ts">
	import { page } from '$app/state';
	import { pageTitles } from '$lib/constants/constant';
	import { ChevronDown, PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
</script>

<script lang="ts">
	let { user }: { user: User.Profile } = $props();

	const isSidebarOpen = getContext<Writable<boolean>>('isSidebarOpen');

	const formattedName = $derived(
		`${user.first_name.charAt(0).toUpperCase()}. ${user.middle_name ? user.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${user.last_name}`
	);
</script>

<nav class="flex border-b border-primary/50 text-primary">
	<div class="flex items-center px-3 py-2">
		<button onclick={() => ($isSidebarOpen = !$isSidebarOpen)}>
			{#if $isSidebarOpen}
				<PanelLeftClose />
			{:else}
				<PanelLeftOpen />
			{/if}
		</button>
	</div>
	<div class="flex flex-1 justify-center">
		{pageTitles[page.url.pathname]}
	</div>
	<div class="flex items-center gap-2xs border-l border-primary/50 px-4 py-2">
		<div class="flex flex-col gap-0 text-right">
			<p class="">{formattedName}</p>
			<span class="small">{user?.role}</span>
		</div>
		<ChevronDown />
	</div>
</nav>
