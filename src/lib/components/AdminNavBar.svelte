<script module lang="ts">
	import { page } from '$app/state';
	import { ICON_SIZE_MEDIUM, pageTitles } from '$lib/constants/constant';
	import UserMenu from '$lib/components/modals/UserMenu.svelte';
	import { Bell, ChevronDown, Inbox, Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import type { Writable } from 'svelte/store';
</script>

<script lang="ts">
	let { user }: { user: User.Profile } = $props();
	let isMenuOpen = $state(false);

	const isSidebarOpen = getContext<Writable<boolean>>('isSidebarOpen');
	const isMobileOpen = getContext<Writable<boolean>>('isMobileOpen');

	const formattedName = $derived(
		`${user.first_name.charAt(0).toUpperCase()}. ${user.middle_name ? user.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${user.last_name}`
	);
</script>

<nav class="relative flex border-b border-primary/20">
	<div class="flex items-center border-r border-primary/20 px-3 py-2">
		<button
			onclick={() => ($isMobileOpen = !$isMobileOpen)}
			class=" md:hidden"
			aria-label="Open menu"
		>
			<Menu />
		</button>
		<button onclick={() => ($isSidebarOpen = !$isSidebarOpen)} class="hidden md:block">
			{#if $isSidebarOpen}
				<PanelLeftClose size={ICON_SIZE_MEDIUM} />
			{:else}
				<PanelLeftOpen size={ICON_SIZE_MEDIUM} />
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
			<Inbox size={ICON_SIZE_MEDIUM} />
			<Bell size={ICON_SIZE_MEDIUM} />
		</div>
	</div>
	<div class="relative flex items-center border-l border-primary/20 px-4 py-1">
		<button class="flex items-center gap-2xs text-left" onclick={() => (isMenuOpen = !isMenuOpen)}>
			<div class="flex flex-col gap-0 text-right">
				<p class="">{formattedName}</p>
				<span class="small">{user?.role}</span>
			</div>
			<ChevronDown class="transition-transform duration-200 {isMenuOpen ? 'rotate-180' : ''}" />
		</button>

		{#if isMenuOpen}
			<UserMenu />
		{/if}
	</div>
</nav>
