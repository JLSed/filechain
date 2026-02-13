<script>
	import AdminNavBar from '$lib/components/AdminNavBar.svelte';
	import SidebarProvider from '$lib/components/providers/SidebarProvider.svelte';
	import Sidebar from '$lib/components/Sidebar.svelte';
	let { children } = $props();
</script>

<div>
	<SidebarProvider>
		<div class="flex h-screen w-full">
			<Sidebar />
			<div class="flex">
				<AdminNavBar />
				{@render children()}
			</div>
		</div>
	</SidebarProvider>
</div>
