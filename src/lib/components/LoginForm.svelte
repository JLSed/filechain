<script lang="ts">
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { goto } from '$app/navigation';

	const supabase = createBrowserClient();
	let loading = $state(false);
	let email = $state('');
	let password = $state('');

	async function handleLogin(e: Event) {
		e.preventDefault();
		loading = true;

		const { error } = await supabase.auth.signInWithPassword({
			email,
			password
		});

		if (!error) {
			goto('/dashboard');
		} else {
			console.error(error);
		}
		loading = false;
	}
</script>

<div class="">
	<h3 class="font-bold">Login</h3>
	<form class="flex flex-col gap-2xs" onsubmit={handleLogin}>
		<div>
			<label>
				<input type="email" id="email" bind:value={email} placeholder="you@example.com" />
			</label>
		</div>

		<div>
			<label>
				<input type="password" id="password" bind:value={password} placeholder="••••••••" />
			</label>
		</div>

		<button type="submit" disabled={loading}>
			{loading ? 'Signing in...' : 'Sign In'}
		</button>
	</form>
</div>
