<script>
	import AdminNavBar from '$lib/components/AdminNavBar.svelte';
	import SidebarProvider from '$lib/components/providers/SidebarProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	let { children, data } = $props();
	const user = $derived(data.profile);
</script>

<div>
	<SidebarProvider>
		<div class="flex h-screen w-full">
			<Sidebar />
			<div class="flex flex-1 flex-col">
				<AdminNavBar {user} />
				<main>
					{@render children()}
				</main>
			</div>
		</div>
	</SidebarProvider>
</div>
