<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button, buttonVariants } from '$lib/shadcn/components/ui/button/index.js';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Label } from '$lib/shadcn/components/ui/label/index.js';
	import * as Select from '$lib/shadcn/components/ui/select/index.js';
	import { RefreshCw, Copy, Check } from '@lucide/svelte';

	let {
		open = $bindable(false),
		form
	}: {
		open: boolean;
		form: { message?: string; success?: boolean; email?: string } | null;
	} = $props();

	let loading = $state(false);
	let copied = $state(false);
	let generatedPassword = $state(generatePassword());
	let selectedRole = $state('user');

	function generatePassword(): string {
		const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
		let password = '';
		const array = new Uint32Array(7);
		crypto.getRandomValues(array);
		for (let i = 0; i < 7; i++) {
			password += chars[array[i] % chars.length];
		}
		return password;
	}

	function regeneratePassword() {
		generatedPassword = generatePassword();
	}

	async function copyPassword() {
		await navigator.clipboard.writeText(generatedPassword);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function handleOpenChange(value: boolean) {
		open = value;
		if (value) {
			generatedPassword = generatePassword();
			selectedRole = 'user';
			loading = false;
			copied = false;
		}
	}
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-120">
		<form
			method="POST"
			action="?/createUser"
			use:enhance={() => {
				loading = true;
				return async ({ update }) => {
					loading = false;
					await update();
				};
			}}
		>
			<Dialog.Header>
				<Dialog.Title>Add new user</Dialog.Title>
				<Dialog.Description>
					Create a new user account. A temporary password will be generated and sent to their email.
				</Dialog.Description>
			</Dialog.Header>

			<div class="grid gap-4 py-4">
				<div class="grid grid-cols-2 gap-3">
					<div class="grid gap-2">
						<Label for="first_name">First name</Label>
						<Input id="first_name" name="first_name" placeholder="John" required />
					</div>
					<div class="grid gap-2">
						<Label for="last_name">Last name</Label>
						<Input id="last_name" name="last_name" placeholder="Doe" required />
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="middle_name"
						>Middle name <span class="text-muted-foreground">(optional)</span></Label
					>
					<Input id="middle_name" name="middle_name" placeholder="Michael" />
				</div>

				<div class="grid gap-2">
					<Label for="email">Email</Label>
					<Input id="email" name="email" type="email" placeholder="john@example.com" required />
				</div>

				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<Select.Root type="single" name="role" bind:value={selectedRole}>
						<Select.Trigger id="role">
							{selectedRole === 'admin' ? 'Admin' : 'User'}
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="user">User</Select.Item>
							<Select.Item value="admin">Admin</Select.Item>
						</Select.Content>
					</Select.Root>
				</div>

				<div class="grid gap-2">
					<Label for="password">Generated password</Label>
					<div class="flex items-center gap-2">
						<Input
							id="password"
							name="password"
							value={generatedPassword}
							readonly
							class="font-mono tracking-wider"
						/>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="shrink-0"
							onclick={regeneratePassword}
							title="Regenerate password"
						>
							<RefreshCw class="size-4" />
						</Button>
						<Button
							type="button"
							variant="outline"
							size="icon"
							class="shrink-0"
							onclick={copyPassword}
							title="Copy password"
						>
							{#if copied}
								<Check class="size-4 text-emerald-500" />
							{:else}
								<Copy class="size-4" />
							{/if}
						</Button>
					</div>
					<p class="text-xs text-muted-foreground">
						This password will be sent to the user's email address.
					</p>
				</div>

				{#if form?.message && !form?.success}
					<p class="text-sm text-destructive">{form.message}</p>
				{/if}
			</div>

			<Dialog.Footer>
				<Dialog.Close type="button" class={buttonVariants({ variant: 'outline' })}>
					Cancel
				</Dialog.Close>
				<Button type="submit" disabled={loading}>
					{#if loading}
						Creating...
					{:else}
						Create user
					{/if}
				</Button>
			</Dialog.Footer>
		</form>
	</Dialog.Content>
</Dialog.Root>
