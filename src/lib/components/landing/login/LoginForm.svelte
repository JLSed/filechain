<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { superForm } from 'sveltekit-superforms';
	let loading = $state(false);
	let { data } = $props();
	const { form, errors, enhance, submitting, message } = superForm(data.form);
	console.log(data);
</script>

<div class="mx-auto w-full max-w-sm">
	<h3 class="mb-4 font-bold text-primary">Log In</h3>
	{#if $message}
		<div class="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500">
			{$message}
		</div>
	{/if}
	<form method="POST" action="/login?/login" class="flex flex-col gap-4" use:enhance>
		<div class="space-y-2">
			<label for="email" class="text-sm leading-none font-medium text-foreground"> Email </label>
			<Input
				type="email"
				name="email"
				id="email"
				bind:value={$form.email}
				placeholder="Enter your email"
			/>
			{#if $errors.email}
				<span class="text-xs text-red-500">{$errors.email[0]}</span>
			{/if}
		</div>

		<div class="space-y-2">
			<label for="password" class="text-sm leading-none font-medium text-foreground">
				Password
			</label>
			<Input
				type="password"
				name="password"
				id="password"
				bind:value={$form.password}
				placeholder="Enter your password"
			/>
			{#if $errors.password}
				<span class="text-xs text-red-500">{$errors.password[0]}</span>
			{/if}
		</div>

		<div class="flex items-center justify-end text-sm">
			<a href="/forgot-password" class="text-primary hover:underline"> Forgot password? </a>
		</div>

		<Button type="submit" disabled={$submitting} class="w-full" size="lg">
			{$submitting ? 'Logging in...' : 'Log In'}
		</Button>
	</form>
</div>
