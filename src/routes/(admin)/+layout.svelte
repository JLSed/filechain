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
			<div class="flex flex-1 flex-col">
				<AdminNavBar {user} />
				<main>
					{@render children()}
				</main>
			</div>
		</div>
	</Sidebar.Provider>
</Tooltip.Provider>
