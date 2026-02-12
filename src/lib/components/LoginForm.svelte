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

<div class="mx-auto w-full max-w-sm">
	<h3 class="mb-4 font-bold text-primary">Log In</h3>
	<form class="flex flex-col gap-4" onsubmit={handleLogin}>
		<div>
			<input type="email" id="email" bind:value={email} placeholder="Email" required />
		</div>

		<div>
			<input type="password" id="password" bind:value={password} placeholder="Password" required />
		</div>

		<div class="flex items-center justify-between text-xs text-gray-500">
			<label class="flex cursor-pointer items-center gap-2"> Forgot password? </label>
		</div>

		<button
			type="submit"
			disabled={loading}
			class="mt-2 w-full rounded-md bg-slate-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-black disabled:opacity-70"
		>
			{loading ? 'Logging in...' : 'Log In'}
		</button>
	</form>
</div>
