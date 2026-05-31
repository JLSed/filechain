<script lang="ts">
	import dmvLogoDark from '$lib/assets/dmv-logo.svg';
	import dmvLogoLight from '$lib/assets/dmv-logo-light.svg';
	import { page } from '$app/stores';
</script>

<nav
	class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md transition-colors duration-300"
>
	<div class="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
		<!-- Logo -->
		<a href="/" class="animate-fade-in flex items-center gap-2 transition-opacity hover:opacity-80">
			<img src={dmvLogoDark} alt="DMVault Logo" class="h-22 w-22 object-contain dark:hidden" />
			<img
				src={dmvLogoLight}
				alt="DMVault Logo"
				class="hidden h-22 w-22 object-contain dark:block"
			/>
		</a>

		<!-- Actions -->
		<div class="flex items-center gap-4">
			{#if !$page.url.pathname.startsWith('/login')}
				<a
					href="/login"
					class="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--chart-1)] sm:block"
				>
					Log In
				</a>
			{:else}
				<a
					href="/"
					class="text-sm font-medium text-muted-foreground transition-colors hover:text-[var(--chart-1)]"
				>
					Back to Home
				</a>
			{/if}
		</div>
	</div>
</nav>
