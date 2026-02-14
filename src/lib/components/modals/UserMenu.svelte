<script lang="ts">
	import { Settings, LogOut } from 'lucide-svelte';
	import { slide } from 'svelte/transition';
</script>

<div
	transition:slide={{ duration: 200, axis: 'y' }}
	class="absolute top-full right-0 z-50 mt-2 min-w-48 overflow-hidden rounded-md border border-primary/20 bg-background shadow-lg ring-1 ring-black/5"
>
	<div class="space-y-2 pt-2">
		<a
			href="/settings"
			class="hover:bg-muted/50 flex w-full items-center gap-2 px-4 py-2 text-sm text-primary transition-colors hover:text-foreground"
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
</div>
