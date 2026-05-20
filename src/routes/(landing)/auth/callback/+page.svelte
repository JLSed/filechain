<script lang="ts">
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { Loader2 } from '@lucide/svelte';

	const supabase = createBrowserClient();

	let error = $state('');

	/**
	 * Logs a "Logged In" audit event via the server-side API endpoint.
	 * Fire-and-forget — does not block navigation on failure.
	 */
	async function logLoginEvent(): Promise<void> {
		try {
			await fetch('/api/audit-log', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					details: '[actor] First Time Logged In',
					eventType: 'Logged In'
				})
			});
		} catch (err) {
			console.error('Auth callback: Failed to log audit event:', err);
		}
	}

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
				.then(async ({ error: sessionError }) => {
					if (sessionError) {
						console.error('Auth callback: Failed to set session:', sessionError.message);
						error = 'Failed to authenticate. Please try the invite link again.';
						return;
					}
					await logLoginEvent();

					// Redirect based on the auth type
					if (type === 'invite') {
						goto('/setup', { replaceState: true });
					} else if (type === 'recovery') {
						goto('/reset-password', { replaceState: true });
					} else {
						goto('/dashboard', { replaceState: true });
					}
				});
		} else {
			// PKCE flow should be handled by +server.ts,
			// but keep this as a client-side fallback
			const searchParams = new URLSearchParams(window.location.search);
			const code = searchParams.get('code');
			const queryType = searchParams.get('type');
			console.log(code, queryType, searchParams);
			if (code) {
				supabase.auth.exchangeCodeForSession(code).then(async ({ error: codeError }) => {
					if (codeError) {
						console.error('Auth callback: Failed to exchange code:', codeError.message);
						error = 'Failed to authenticate. Please try the invite link again.';
						return;
					}
					await logLoginEvent();

					if (queryType === 'recovery') {
						goto('/reset-password', { replaceState: true });
					} else if (queryType === 'invite') {
						goto('/setup', { replaceState: true });
					} else {
						goto('/dashboard', { replaceState: true });
					}
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
				<a href="/login" class="mt-4 inline-block text-sm text-primary underline"> Go to login </a>
			</div>
		{:else}
			<Loader2 class="mx-auto mb-4 h-8 w-8 animate-spin text-primary" />
			<p class="text-sm text-muted-foreground">Setting up your account...</p>
		{/if}
	</div>
</div>
