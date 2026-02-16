<script lang="ts">
	import { page } from '$app/state';
	import { sidebarGroups } from '$lib/constants/constant';
	import * as Sidebar from '$lib/shadcn/components/ui/sidebar/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import Logo from '$lib/assets/dmv-logo-light.svg';
	import { SquareUser, ChevronsUpDown, Settings, LogOut } from '@lucide/svelte';

	let { user }: { user: User.Profile } = $props();

	const sidebar = Sidebar.useSidebar();

	const formattedName = $derived(
		`${user.first_name.charAt(0).toUpperCase()}. ${user.middle_name ? user.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${user.last_name}`
	);
</script>

<Sidebar.Root collapsible="icon">
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton size="lg">
					{#snippet child({ props })}
						<a href="/dashboard" class="flex items-center gap-2" {...props}>
							<img src={Logo} alt="DMV Logo" class="size-8 shrink-0" />
							<div class="flex flex-col items-start">
								<span class="font-semibold">DMV IP Consultancy</span>
								<span class="text-xs text-sidebar-foreground/70">Services</span>
							</div>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>
	<Sidebar.Content>
		{#each sidebarGroups as group (group.label)}
			<Sidebar.Group>
				<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>
				<Sidebar.GroupContent>
					<Sidebar.Menu>
						{#each group.items as item (item.title)}
							<Sidebar.MenuItem>
								<Sidebar.MenuButton
									isActive={page.url.pathname === item.url}
									tooltipContent={item.title}
								>
									{#snippet child({ props })}
										<a href={item.url} {...props}>
											<item.icon />
											<span>{item.title}</span>
										</a>
									{/snippet}
								</Sidebar.MenuButton>
							</Sidebar.MenuItem>
						{/each}
					</Sidebar.Menu>
				</Sidebar.GroupContent>
			</Sidebar.Group>
		{/each}
	</Sidebar.Content>
	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger>
						{#snippet child({ props })}
							<Sidebar.MenuButton
								size="lg"
								class=" data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
								{...props}
							>
								<SquareUser class="size-6!" />
								<div class="grid flex-1 text-start text-sm leading-tight">
									<span class="truncate font-medium">{formattedName}</span>
									<span class="truncate text-xs">{user.role}</span>
								</div>
								<ChevronsUpDown class="ms-auto size-4" />
							</Sidebar.MenuButton>
						{/snippet}
					</DropdownMenu.Trigger>
					<DropdownMenu.Content
						class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg"
						side={sidebar.isMobile ? 'bottom' : 'right'}
						align="end"
						sideOffset={4}
					>
						<DropdownMenu.Label class="p-0 font-normal">
							<div class="flex items-center gap-2 px-1 py-1.5 text-start text-sm">
								<SquareUser class="size-8" />
								<div class="grid flex-1 text-start text-sm leading-tight">
									<span class="truncate font-medium">{formattedName}</span>
									<span class="truncate text-xs">{user.role}</span>
								</div>
							</div>
						</DropdownMenu.Label>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<a href="/settings" class="flex w-full items-center gap-2">
								<Settings />
								Settings
							</a>
						</DropdownMenu.Item>
						<DropdownMenu.Separator />
						<DropdownMenu.Item>
							<form action="/dashboard?/logout" method="POST" class="w-full">
								<button type="submit" class="flex w-full items-center gap-2 text-left text-sm">
									<LogOut />
									Log out
								</button>
							</form>
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Footer>
</Sidebar.Root>
