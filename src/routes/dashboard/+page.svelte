<script lang="ts">
	let { data } = $props();

	// `data.session` and `data.user` are automatically passed down
	// from your root +layout.server.ts
	let { user } = data;
</script>

<div class="mx-auto max-w-4xl p-8">
	<h1 class="mb-6 text-3xl font-bold">Dashboard</h1>

	<div class="rounded-lg border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
		<h2 class="mb-4 text-xl font-semibold text-emerald-400">Secure Session Active</h2>

		<div class="space-y-2 text-zinc-300">
			<p><strong>Email:</strong> {user?.email}</p>
			<p><strong>User ID:</strong> <span class="font-mono text-sm">{user?.id}</span></p>
			<p><strong>Last Sign In:</strong> {new Date(user?.last_sign_in_at || '').toLocaleString()}</p>
		</div>

		<div class="mt-8 border-t border-zinc-700 pt-6">
			<form action="?/logout" method="POST">
				<button
					type="submit"
					class="rounded-md border border-red-500/20 bg-red-500/10 px-4 py-2 font-medium text-red-500 transition-colors hover:bg-red-500/20"
				>
					Sign Out
				</button>
			</form>
		</div>
	</div>
</div>
