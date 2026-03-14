<script lang="ts">
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Loader2 } from '@lucide/svelte';

	const supabase = createBrowserClient();

	let error = $state('');

	/**
	 * Auth callback route for Supabase invite flow.
	 *
	 * Supabase uses the implicit grant flow for invites — tokens arrive
	 * in the URL hash fragment (#access_token=...) which is only accessible
	 * client-side. This page detects the auth event and redirects to /setup.
	 */
	onMount(() => {
		const hashParams = new URLSearchParams(window.location.hash.substring(1));
		const accessToken = hashParams.get('access_token');
		const refreshToken = hashParams.get('refresh_token');
		const type = hashParams.get('type');

		if (accessToken && refreshToken) {
			supabase.auth
				.setSession({
					access_token: accessToken,
					refresh_token: refreshToken
				})
				.then(({ error: sessionError }) => {
					if (sessionError) {
						console.error('Auth callback: Failed to set session:', sessionError.message);
						error = 'Failed to authenticate. Please try the invite link again.';
						return;
					}

					// Redirect to setup page for password + master key setup
					if (type === 'invite') {
						goto('/setup', { replaceState: true });
					} else {
						goto('/dashboard', { replaceState: true });
					}
				});
		} else {
			// Check if there's a code in query params (PKCE flow fallback)
			const code = new URLSearchParams(window.location.search).get('code');
			if (code) {
				supabase.auth.exchangeCodeForSession(code).then(({ error: codeError }) => {
					if (codeError) {
						console.error('Auth callback: Failed to exchange code:', codeError.message);
						error = 'Failed to authenticate. Please try the invite link again.';
						return;
					}
					goto('/setup', { replaceState: true });
				});
			} else {
				error = 'No authentication tokens found. Please check your invite link.';
			}
		}
	});
</script>

<div class="flex min-h-screen items-center justify-center bg-gray-50">
	<div class="text-center">
		{#if error}
			<div class="rounded-lg border border-red-200 bg-red-50 p-6">
				<p class="text-sm text-destructive">{error}</p>
				<a href="/login" class="mt-4 inline-block text-sm text-primary underline">
					Go to login
				</a>
			</div>
		{:else}
			<Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
			<p class="text-sm text-muted-foreground">Setting up your account...</p>
		{/if}
	</div>
</div>
