<script lang="ts">
	import './layout.css';
	import logo from '$lib/assets/logo.svg';
	import { onMount } from 'svelte';
	import { invalidate } from '$app/navigation';
	import { createBrowserClient } from '$lib/services/supabase/client';

	let { data, children } = $props();

	const supabase = createBrowserClient();

	/**
	 * Listen for auth state changes on the client side.
	 * When a token is refreshed or the user signs in/out,
	 * invalidate the `supabase:auth` dependency so the
	 * layout server loader re-runs and the session stays in sync.
	 */
	onMount(() => {
		const {
			data: { subscription }
		} = supabase.auth.onAuthStateChange((_event, newSession) => {
			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href={logo} /></svelte:head>
{@render children()}
