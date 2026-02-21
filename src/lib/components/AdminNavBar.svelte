<script module lang="ts">
	import { page } from '$app/state';
	import { pageTitles } from '$lib/constants/constant';
	import { Bell, Inbox, Menu, PanelLeftClose, PanelLeftOpen } from '@lucide/svelte';
	import { useSidebar } from '$lib/shadcn/components/ui/sidebar/context.svelte.js';
</script>

<script lang="ts">
	let { user }: { user: User.Profile } = $props();
	let isMenuOpen = $state(false);

	const sidebar = useSidebar();

	const formattedName = $derived(
		`${user.first_name.charAt(0).toUpperCase()}. ${user.middle_name ? user.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${user.last_name}`
	);
</script>

<nav class="sticky flex border-b border-primary/20">
	<div class="flex items-center border-r border-primary/20 px-3 py-2">
		<button onclick={() => sidebar.toggle()} class="md:hidden" aria-label="Open menu">
			<Menu />
		</button>
		<button onclick={() => sidebar.toggle()} class="hidden md:block">
			{#if sidebar.open}
				<PanelLeftClose />
			{:else}
				<PanelLeftOpen />
			{/if}
		</button>
	</div>
	<div class="flex flex-1 items-center px-4">
		<div>
			<h6 class="font-medium">
				{pageTitles[page.url.pathname]}
			</h6>
		</div>
		<div class="flex flex-1 items-center justify-end gap-4 md:flex">
			<Inbox />
			<Bell />
		</div>
	</div>
</nav>
