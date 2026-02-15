<script>
	import AdminNavBar from '$lib/components/AdminNavBar.svelte';
	import AppSidebar from '$lib/components/shadcn/app-sidebar.svelte';
	let { children, data } = $props();
	const user = $derived(data.profile);
	import * as Sidebar from '$lib/components/shadcn/ui/sidebar/index.js';
</script>

<div>
	<Sidebar.Provider>
		<AppSidebar />
		<div class="flex h-screen w-full">
			<div class="flex flex-1 flex-col">
				<AdminNavBar {user} />
				<main>
					{@render children()}
				</main>
			</div>
		</div>
	</Sidebar.Provider>
</div>
