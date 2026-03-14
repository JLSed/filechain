<script lang="ts">
	import { superForm, type SuperValidated } from 'sveltekit-superforms';
	import { zod4 } from 'sveltekit-superforms/adapters';
	import { AddUserFormSchema, type AddUserFormData } from '$lib/types/FormTypes';
	import { USER_ROLES } from '$lib/constants/SchemaData';
	import { untrack } from 'svelte';
	import { invalidate } from '$app/navigation';

	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';

	interface ComponentProps {
		data: { form: SuperValidated<AddUserFormData> };
		onCancel: () => void;
		onSuccess: () => void;
	}

	let { data, onCancel, onSuccess }: ComponentProps = $props();

	const { form, errors, enhance, submitting, message } = superForm(
		untrack(() => data.form),
		{
			validators: zod4(AddUserFormSchema),
			resetForm: true,
			onResult: ({ result }) => {
				if (result.type === 'success') {
					invalidate('db:user-profiles');
					onSuccess();
				}
			}
		}
	);

	/**
	 * Extracts the first error message from a superforms error field.
	 */
	function getError(field: unknown): string | undefined {
		if (!field) return undefined;
		if (Array.isArray(field) && field.length > 0) return String(field[0]);
		if (typeof field === 'object' && field !== null && '_errors' in field) {
			const errs = (field as { _errors?: string[] })._errors;
			if (errs && errs.length > 0) return errs[0];
		}
		return undefined;
	}
</script>

<div class="mx-auto max-w-3xl flex-1 max-h-full overflow-y-auto">
	<form method="POST" action="?/addUser" use:enhance class="flex flex-col p-6 gap-8">
		{#if $message}
			<div class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-500">
				{$message}
			</div>
		{/if}

		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold">User Information</h2>
				<p class="text-sm text-muted-foreground">
					Enter the basic details for the new user account.
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="first_name" class="text-sm font-medium">
						First Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="first_name"
						name="first_name"
						bind:value={$form.first_name}
						placeholder="Enter first name"
					/>
					{#if getError($errors.first_name)}
						<span class="text-xs text-destructive">{getError($errors.first_name)}</span>
					{/if}
				</div>
				<div class="space-y-2">
					<label for="middle_name" class="text-sm font-medium">Middle Name</label>
					<Input
						id="middle_name"
						name="middle_name"
						bind:value={$form.middle_name}
						placeholder="Enter middle name"
					/>
				</div>
				<div class="sm:col-span-2 space-y-2">
					<label for="last_name" class="text-sm font-medium">
						Last Name <span class="text-destructive">*</span>
					</label>
					<Input
						id="last_name"
						name="last_name"
						bind:value={$form.last_name}
						placeholder="Enter last name"
					/>
					{#if getError($errors.last_name)}
						<span class="text-xs text-destructive">{getError($errors.last_name)}</span>
					{/if}
				</div>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="sm:col-span-2 space-y-2">
					<label for="email" class="text-sm font-medium">
						Email <span class="text-destructive">*</span>
					</label>
					<Input
						id="email"
						name="email"
						type="email"
						bind:value={$form.email}
						placeholder="Enter email address"
					/>
					{#if getError($errors.email)}
						<span class="text-xs text-destructive">{getError($errors.email)}</span>
					{/if}
					<p class="text-xs text-muted-foreground">
						An invitation email will be sent. The user will set their own password.
					</p>
				</div>
			</div>
		</div>

		<hr />

		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold">Contact Details</h2>
				<p class="text-sm text-muted-foreground">
					Add optional contact information for this user.
				</p>
			</div>

			<div class="grid gap-4 sm:grid-cols-2">
				<div class="space-y-2">
					<label for="contact_number" class="text-sm font-medium">Contact Number</label>
					<Input
						id="contact_number"
						name="contact_number"
						bind:value={$form.contact_number}
						placeholder="e.g. +63 912 345 6789"
					/>
					{#if getError($errors.contact_number)}
						<span class="text-xs text-destructive">{getError($errors.contact_number)}</span>
					{/if}
				</div>
				<div class="space-y-2">
					<label for="address" class="text-sm font-medium">Address</label>
					<Input
						id="address"
						name="address"
						bind:value={$form.address}
						placeholder="Enter full address"
					/>
					{#if getError($errors.address)}
						<span class="text-xs text-destructive">{getError($errors.address)}</span>
					{/if}
				</div>
			</div>
		</div>

		<hr />

		<div class="space-y-6">
			<div>
				<h2 class="text-lg font-semibold">Role Selection</h2>
				<p class="text-sm text-muted-foreground">
					Assign a role that determines the user's permissions in the system.
				</p>
			</div>

			<div class="grid gap-2">
				{#each USER_ROLES as role (role)}
					<label
						class="flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 transition-colors hover:bg-muted
							{$form.role === role ? 'border-primary bg-primary/5' : 'border-border'}"
					>
						<input
							type="radio"
							name="role"
							value={role}
							checked={$form.role === role}
							onchange={() => ($form.role = role)}
							class="accent-primary"
						/>
						<span class="text-sm font-medium">{role}</span>
					</label>
				{/each}
			</div>
			{#if getError($errors.role)}
				<span class="text-xs text-destructive">{getError($errors.role)}</span>
			{/if}
		</div>

		<!-- Navigation buttons -->
		<div class="mt-4 flex items-center justify-between border-t border-border pt-4">
			<Button type="button" variant="outline" onclick={onCancel}>Cancel</Button>
			<Button type="submit" disabled={$submitting}>
				{$submitting ? 'Sending Invite...' : 'Invite User'}
			</Button>
		</div>
	</form>
</div>

