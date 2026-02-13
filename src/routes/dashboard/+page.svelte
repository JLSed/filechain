<script lang="ts">
	let { data } = $props();

	// `data.session` and `data.user` are automatically passed down
	// from your root +layout.server.ts
	const user = $derived(data.user);
</script>

<div>
	<h1 class="">Dashboard</h1>

	<div>
		<h2>
			<div>
				<p><strong>Email:</strong> {user?.email}</p>
				<p><strong>User ID: {user?.id}</strong></p>
				<p>
					<strong>Last Sign In:</strong>
					{new Date(user?.last_sign_in_at || '').toLocaleString()}
				</p>
			</div>

			<div>
				<form action="?/logout" method="POST">
					<button type="submit"> Sign Out </button>
				</form>
			</div>
		</h2>
	</div>
</div>
