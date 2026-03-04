<script>
	import AdminNavBar from '$lib/components/AdminNavBar.svelte';
	import AdminSidebar from '$lib/components/AdminSidebar.svelte';
	let { children, data } = $props();
	const user = $derived(data.profile);
	import * as Sidebar from '$lib/shadcn/components/ui/sidebar/index.js';
	import * as Tooltip from '$lib/shadcn/components/ui/tooltip/index.js';
</script>

<Tooltip.Provider>
	<Sidebar.Provider>
		<div class="flex h-screen w-full">
			<AdminSidebar {user} />
			<div class="flex min-w-0 flex-1 flex-col">
				<AdminNavBar {user} />
				<main class="flex-1 overflow-x-hidden overflow-y-auto">
					{@render children()}
				</main>
			</div>
		</div>
	</Sidebar.Provider>
</Tooltip.Provider>
