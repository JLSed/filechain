<script lang="ts">
	import { page } from '$app/state';
	import { navGroups } from '$lib/constants/constant';
	import { ChevronDown, ChevronRight } from 'lucide-svelte';
	import { getContext } from 'svelte';
	import { slide, fade } from 'svelte/transition';
	import type { Writable } from 'svelte/store';
	import dmvLogo from '$lib/assets/dmv-logo-light.svg';

	const isSidebarOpen = getContext<Writable<boolean>>('isSidebarOpen');
	const isMobileOpen = getContext<Writable<boolean>>('isMobileOpen');

	// Track expanded state for items with children, keyed by href where true = expanded
	let expandedItems = $state<Record<string, boolean>>({});

	// Derived state
	const pathname = $derived(page.url.pathname);

	const isActive = (href: string) => {
		if (href === '/dashboard') {
			return pathname === '/dashboard';
		}
		return pathname.startsWith(href);
	};

	function closeMobile() {
		$isMobileOpen = false;
	}

	function handleNavClick() {
		// Close sidebar on mobile when navigating
		closeMobile();
	}

	function toggleExpanded(href: string, hasChildren: boolean, e: MouseEvent) {
		if (hasChildren && $isSidebarOpen) {
			e.preventDefault();
			const current = expandedItems[href];
			expandedItems[href] = !current;
		} else {
			handleNavClick();
		}
	}
</script>

{#snippet navItem(item: Sidebar.NavItem)}
	{@const hasChildren = item.children && item.children.length > 0}
	{@const itemActive = isActive(item.href)}
	{@const childActive = item.children?.some((child) => isActive(child.href))}
	{@const isExpanded = expandedItems[item.href]}

	<div>
		<a
			href={item.href}
			onclick={(e) => toggleExpanded(item.href, !!hasChildren, e)}
			class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors {itemActive ||
			childActive
				? 'bg-background/30 text-background'
				: 'text-background/80 hover:bg-background/10 hover:text-background'}"
			title={!$isSidebarOpen ? item.label : undefined}
		>
			<span class="shrink-0">
				<item.icon size={20} />
			</span>
			<span
				class="flex-1 overflow-hidden text-sm whitespace-nowrap transition-all duration-300 {!$isSidebarOpen
					? 'w-auto opacity-100 md:w-0 md:opacity-0'
					: 'w-auto opacity-100'}"
			>
				{item.label}
			</span>
			{#if hasChildren}
				<span
					class="hidden shrink-0 transition-opacity duration-300 md:block {!$isSidebarOpen
						? 'w-0 opacity-0'
						: 'opacity-100'}"
				>
					{#if isExpanded}
						<ChevronDown size={16} />
					{:else}
						<ChevronRight size={16} />
					{/if}
				</span>
			{/if}
		</a>

		<!-- Sub-items -->
		{#if hasChildren && isExpanded && $isSidebarOpen}
			<div class="mt-1 ml-6 hidden space-y-1 md:block" transition:slide>
				{#each item.children! as child (child.href)}
					<a
						href={child.href}
						onclick={handleNavClick}
						class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {isActive(
							child.href
						)
							? 'bg-background/20 text-background'
							: 'text-background/70 hover:bg-background/10 hover:text-background'}"
					>
						<span class="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
						{child.label}
					</a>
				{/each}
			</div>
		{/if}

		<!-- Mobile sub-items (always visible when parent is active) -->
		{#if hasChildren}
			<div class="mt-1 ml-6 space-y-1 md:hidden">
				{#each item.children! as child (child.href)}
					<a
						href={child.href}
						onclick={handleNavClick}
						class="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors {isActive(
							child.href
						)
							? 'bg-background/20 text-background'
							: 'text-background/70 hover:bg-background/10 hover:text-background'}"
					>
						<span class="h-1.5 w-1.5 rounded-full bg-current opacity-50"></span>
						{child.label}
					</a>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<!-- Mobile backdrop overlay -->
{#if $isMobileOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="fixed inset-0 z-40 bg-black/50 md:hidden" onclick={closeMobile}></div>
{/if}

<aside
	class="fixed z-50 flex h-screen flex-col overflow-hidden bg-primary
      text-background transition-all duration-300 md:relative
      {$isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      md:translate-x-0
      {!$isSidebarOpen ? 'md:w-16' : 'md:w-64'}
      w-64"
>
	<!-- Logo Section -->
	<div class="flex items-center justify-center gap-3 px-4 py-4">
		<div class="flex h-8 w-24 items-center">
			<img src={dmvLogo} alt="DMV Logo" />
		</div>
	</div>

	<!-- Navigation Groups -->
	<div class="flex-1 overflow-hidden overflow-y-auto">
		{#each navGroups as group (group.label)}
			<div class="py-4">
				<span
					class="block overflow-hidden px-4 text-xs tracking-wider whitespace-nowrap text-background/30 uppercase transition-all duration-300 {!$isSidebarOpen
						? 'h-auto opacity-100 md:h-0 md:opacity-0'
						: 'h-auto opacity-100'}"
				>
					{group.label}
				</span>
				<nav class="mt-2 space-y-1 px-2">
					{#each group.items as item (item.href)}
						{@render navItem(item)}
					{/each}
				</nav>
			</div>
		{/each}
	</div>
</aside>
