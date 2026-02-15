<script module lang="ts">
	import { page } from '$app/state';
	import { ICON_SIZE_MEDIUM, pageTitles } from '$lib/constants/constant';
	import {
		Bell,
		ChevronDown,
		Inbox,
		LogOut,
		Menu,
		PanelLeftClose,
		PanelLeftOpen,
		Settings
	} from 'lucide-svelte';
	import { Trigger } from './shadcn/ui/sidebar';
	import * as Popover from '$lib/components/shadcn/ui/popover/index.js';
</script>

<script lang="ts">
	let { user }: { user: User.Profile } = $props();
	let isMenuOpen = $state(false);

	const formattedName = $derived(
		`${user.first_name.charAt(0).toUpperCase()}. ${user.middle_name ? user.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${user.last_name}`
	);
</script>

<nav class="relative flex border-b border-primary/20">
	<div class="flex items-center border-r border-primary/20 px-3 py-2">
		<Trigger />
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
		<Popover.Root bind:open={isMenuOpen}>
			<Popover.Trigger class="flex items-center gap-2 text-left">
				<div class="flex flex-col gap-0 text-right">
					<p>{formattedName}</p>
					<span class="small">{user?.role}</span>
				</div>
				<ChevronDown class="transition-transform duration-200 {isMenuOpen ? 'rotate-180' : ''}" />
			</Popover.Trigger>
			<Popover.Content class="p-0">
				<div class="space-y-2 pt-2">
					<a
						href="/settings"
						class="flex w-full items-center gap-2 px-4 py-2 text-sm text-primary transition-colors hover:bg-muted/50 hover:text-foreground"
					>
						<Settings size={16} />
						Settings
					</a>

					<form action="/dashboard?/logout" method="POST" class="w-full">
						<button
							type="submit"
							class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-500 transition-colors hover:bg-red-500/10 hover:text-red-600"
						>
							<LogOut size={16} />
							Log Out
						</button>
					</form>
				</div>
			</Popover.Content>
		</Popover.Root>
	</div>
</nav>
