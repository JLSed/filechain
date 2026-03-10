<script lang="ts">
	import { page } from '$app/stores';
	import { browser } from '$app/environment';

	function handleRefresh() {
		if (browser) {
			window.location.reload();
		}
	}
</script>

<div
	class="flex h-screen w-full flex-col items-center justify-center bg-zinc-50 p-4 text-center dark:bg-zinc-950"
>
	<div
		class="max-w-md space-y-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
	>
		<div
			class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30"
		>
			<svg
				class="h-8 w-8 text-red-600 dark:text-red-500"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
				stroke-width="1.5"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
				/>
			</svg>
		</div>

		<div class="space-y-3">
			<h1 class="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
				Ops... Something went wrong
			</h1>

			<p class="text-zinc-600 dark:text-zinc-400">
				{$page.error?.message || 'An unexpected error occurred. Please try again later.'}
			</p>
		</div>

		{#if $page.status}
			<div
				class="inline-flex items-center rounded-md bg-zinc-100 px-3 py-1 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300"
			>
				Error Code: {$page.status}
			</div>
		{/if}

		<div class="pt-4">
			<button
				onclick={handleRefresh}
				class="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-8 text-sm font-medium text-white transition-colors hover:bg-zinc-900/90 focus:ring-2 focus:ring-zinc-950 focus:ring-offset-2 focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 dark:focus:ring-zinc-300"
			>
				Refresh Page
			</button>
		</div>
	</div>
</div>
