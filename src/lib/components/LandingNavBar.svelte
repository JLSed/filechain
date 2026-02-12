<script lang="ts">
	import dmvLogo from '$lib/assets/dmv-logo.svg';
	import { page } from '$app/stores';
</script>

<nav class="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md">
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2 transition-opacity hover:opacity-80">
			<img src={dmvLogo} alt="Pepper Logo" class="h-22 w-22 object-contain" />
			<!-- <span class="text-xl font-bold tracking-tight text-slate-800">DMV IP Consultancy</span> -->
		</a>

		<!-- Actions -->
		<div class="flex items-center gap-4">
			{#if $page.url.pathname !== '/login'}
				<a
					href="/login"
					class="hidden text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600 sm:block"
				>
					Log In
				</a>
				<a
					href="/login"
					class="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-black"
				>
					Get Started
				</a>
			{:else}
				<a
					href="/"
					class="text-sm font-medium text-slate-600 transition-colors hover:text-emerald-600"
				>
					Back to Home
				</a>
			{/if}
		</div>
	</div>
</nav>
