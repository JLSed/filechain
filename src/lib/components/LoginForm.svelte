<script lang="ts">
	import { enhance } from '$app/forms';

	let loading = $state(false);
	let errorMessage = $state('');

	interface LoginFormProps {
		form: { message?: string; email?: string } | null;
	}
	let { form = null }: LoginFormProps = $props();
</script>

<div class="mx-auto w-full max-w-sm">
	<h3 class="mb-4 font-bold text-primary">Log In</h3>
	{#if form?.message || errorMessage}
		<p class="mb-3 text-sm text-red-600">{form?.message ?? errorMessage}</p>
	{/if}
	<form
		method="POST"
		action="/login?/login"
		class="flex flex-col gap-4"
		use:enhance={() => {
			loading = true;
			errorMessage = '';
			return async ({ update }) => {
				loading = false;
				await update();
			};
		}}
	>
		<div>
			<input
				type="email"
				name="email"
				id="email"
				value={form?.email ?? ''}
				placeholder="Email"
				required
			/>
		</div>

		<div>
			<input type="password" name="password" id="password" placeholder="Password" required />
		</div>

		<div class="flex items-center justify-between text-xs text-gray-500">
			<span class="flex cursor-pointer items-center gap-2"> Forgot password? </span>
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
