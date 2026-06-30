<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { TriangleAlert, Loader2 } from '@lucide/svelte';

	interface Props {
		open: boolean;
		/** Display name of the item being archived */
		itemName: string;
		/** Type label (e.g. "Client", "Application", "File") */
		itemType: string;
		/** If true, user must type ARCHIVE to confirm (for high-impact items) */
		requireTypedConfirmation?: boolean;
		submitting?: boolean;
		errorMessage?: string | null;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open = $bindable(),
		itemName,
		itemType,
		requireTypedConfirmation = false,
		submitting = false,
		errorMessage = null,
		onconfirm,
		oncancel
	}: Props = $props();

	let confirmText = $state('');

	const canConfirm = $derived(
		requireTypedConfirmation ? confirmText.toUpperCase() === 'ARCHIVE' : true
	);

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			confirmText = '';
			oncancel();
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title>Archive {itemType}</Dialog.Title>
			<Dialog.Description>
				This item will be archived and permanently deleted after 30 days.
			</Dialog.Description>
		</Dialog.Header>

		<div
			class="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950"
		>
			<TriangleAlert class="mt-0.5 size-5 shrink-0 text-amber-600 dark:text-amber-400" />
			<div>
				<p class="text-sm font-medium text-amber-800 dark:text-amber-200">
					{itemName}
				</p>
				<p class="mt-1 text-xs text-amber-700 dark:text-amber-300">
					This {itemType.toLowerCase()} will be hidden from the system immediately. It can be restored
					from Settings within 30 days before permanent deletion.
				</p>
			</div>
		</div>

		{#if requireTypedConfirmation}
			<div class="mt-3 grid gap-2">
				<p class="text-sm text-muted-foreground">
					Type <span class="font-mono font-semibold text-foreground">ARCHIVE</span> to confirm:
				</p>
				<Input
					bind:value={confirmText}
					placeholder="ARCHIVE"
					disabled={submitting}
					autocomplete="off"
				/>
			</div>
		{/if}

		{#if errorMessage}
			<p class="mt-3 text-sm text-destructive">{errorMessage}</p>
		{/if}

		<Dialog.Footer class="mt-4">
			<Button type="button" variant="outline" onclick={oncancel} disabled={submitting}
				>Cancel</Button
			>
			<Button variant="destructive" onclick={onconfirm} disabled={submitting || !canConfirm}>
				{#if submitting}
					<Loader2 class="size-4 animate-spin" />
					Archiving…
				{:else}
					Archive {itemType}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
