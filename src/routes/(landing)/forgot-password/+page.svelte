<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ArrowLeft, Loader2 } from '@lucide/svelte';
	import type { PageProps } from './$types';
	import { untrack } from 'svelte';

	let { data }: PageProps = $props();

	let emailSent = $state(false);

	const { form, errors, enhance, submitting } = superForm(
		untrack(() => data.form),
		{
			onResult: ({ result }) => {
				if (result.type === 'success') {
					emailSent = true;
				}
			}
		}
	);
</script>

<div class="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
	<div class="z-10 w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
		{#if emailSent}
			<!-- Success State -->
			<div class="text-center">
				<h1 class="text-2xl font-bold text-gray-900">Check your email</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					If an account exists with that email, we've sent a password reset link. Please check your
					inbox and spam folder.
				</p>
				<a
					href="/login"
					class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to login
				</a>
			</div>
		{:else}
			<!-- Form State -->
			<div class="mb-6">
				<h1 class="text-2xl font-bold text-gray-900">Forgot your password?</h1>
				<p class="mt-2 text-sm text-muted-foreground">
					Enter your email address and we'll send you a link to reset your password.
				</p>
			</div>

			<form method="POST" action="?/forgotPassword" use:enhance class="space-y-4">
				<div>
					<label for="email" class="mb-1 block text-sm font-medium text-gray-700">Email</label>
					<Input
						id="email"
						name="email"
						type="email"
						placeholder="your@email.com"
						bind:value={$form.email}
						class={$errors.email ? 'border-destructive' : ''}
					/>
					{#if $errors.email}
						<p class="mt-1 text-xs text-destructive">{$errors.email}</p>
					{/if}
				</div>

				<Button type="submit" class="w-full" disabled={$submitting}>
					{#if $submitting}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
					{/if}
					Send Reset Link
				</Button>
			</form>

			<div class="mt-4 text-center">
				<a
					href="/login"
					class="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
				>
					<ArrowLeft class="h-4 w-4" />
					Back to login
				</a>
			</div>
		{/if}
	</div>
</div>
