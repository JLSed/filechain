<script lang="ts">
	import './layout.css';
	import dmvLogo from '$lib/assets/dmv-logo-light.svg';
	import LandingNavBar from '$lib/components/LandingNavBar.svelte';
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
		} = supabase.auth.onAuthStateChange((event, newSession) => {
			// Only invalidate on token refreshes or sign-outs.
			// SIGNED_IN and INITIAL_SESSION are already handled server-side
			// via form actions, so re-invalidating would cause redundant requests.
			if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') return;

			if (newSession?.expires_at !== data.session?.expires_at) {
				invalidate('supabase:auth');
			}
		});

		return () => subscription.unsubscribe();
	});
</script>

<svelte:head><link rel="icon" href={dmvLogo} /></svelte:head>

{#if !data.session}
	<LandingNavBar />
{/if}

{@render children()}
