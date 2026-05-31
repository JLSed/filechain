<script lang="ts">
	import { onMount } from 'svelte';
	import HeroSection from '$lib/components/landing/HeroSection.svelte';

	onMount(() => {
		// Ensure light theme is active on the landing page
		document.documentElement.classList.remove('dark');
	});
</script>

<HeroSection />
