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

<div class="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center">
	<div class="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900/50 p-8">
		<h1 class="mb-6 text-center text-2xl font-bold">Login</h1>

		<form onsubmit={handleLogin} class="space-y-4">
			<div>
				<label class="mb-1 block text-sm font-medium" for="email">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label class="mb-1 block text-sm font-medium" for="password">Password</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="w-full rounded border border-zinc-800 bg-zinc-950 px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full rounded bg-emerald-600 px-4 py-2 font-medium transition-colors hover:bg-emerald-500 disabled:opacity-50"
			>
				{loading ? 'Signing in...' : 'Sign In'}
			</button>
		</form>
	</div>
</div>
