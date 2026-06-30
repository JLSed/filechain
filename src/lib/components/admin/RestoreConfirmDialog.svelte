<script lang="ts">
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { RotateCcw, Loader2 } from '@lucide/svelte';

	interface Props {
		open: boolean;
		itemName: string;
		itemType: string;
		submitting?: boolean;
		errorMessage?: string | null;
		onconfirm: () => void;
		oncancel: () => void;
	}

	let {
		open = $bindable(),
		itemName,
		itemType,
		submitting = false,
		errorMessage = null,
		onconfirm,
		oncancel
	}: Props = $props();

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) oncancel();
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<RotateCcw class="size-4" />
				Restore {itemType}
			</Dialog.Title>
			<Dialog.Description>
				This will restore the item and make it active in the system again.
			</Dialog.Description>
		</Dialog.Header>

		<div
			class="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950"
		>
			<RotateCcw class="mt-0.5 size-5 shrink-0 text-emerald-600 dark:text-emerald-400" />
			<div>
				<p class="text-sm font-medium text-emerald-800 dark:text-emerald-200">
					{itemName}
				</p>
				<p class="mt-1 text-xs text-emerald-700 dark:text-emerald-300">
					This {itemType.toLowerCase()} and its associated data will be restored to an active state.
				</p>
			</div>
		</div>

		{#if errorMessage}
			<p class="mt-3 text-sm text-destructive">{errorMessage}</p>
		{/if}

		<Dialog.Footer class="mt-4">
			<Button type="button" variant="outline" onclick={oncancel} disabled={submitting}
				>Cancel</Button
			>
			<Button onclick={onconfirm} disabled={submitting}>
				{#if submitting}
					<Loader2 class="size-4 animate-spin" />
					Restoring…
				{:else}
					Restore {itemType}
				{/if}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
