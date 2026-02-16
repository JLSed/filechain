<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/shadcn/components/ui/button';
	import { Input } from '$lib/shadcn/components/ui/input';

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
		<div
			class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
		>
			{form?.message ?? errorMessage}
		</div>
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
		<div class="space-y-2">
			<label for="email" class="text-sm leading-none font-medium text-foreground"> Email </label>
			<Input
				type="email"
				name="email"
				id="email"
				value={form?.email ?? ''}
				placeholder="Enter your email"
				required
			/>
		</div>

		<div class="space-y-2">
			<label for="password" class="text-sm leading-none font-medium text-foreground">
				Password
			</label>
			<Input
				type="password"
				name="password"
				id="password"
				placeholder="Enter your password"
				required
			/>
		</div>

		<div class="flex items-center justify-end text-sm">
			<a href="/forgot-password" class="text-primary hover:underline"> Forgot password? </a>
		</div>

		<Button type="submit" disabled={loading} class="w-full" size="lg">
			{loading ? 'Logging in...' : 'Log In'}
		</Button>
	</form>
</div>
