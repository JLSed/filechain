<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import { Pencil, X, Save, Loader2, Archive } from '@lucide/svelte';

	interface Props {
		isEditing: boolean;
		saving?: boolean;
		canEdit?: boolean;
		canArchive?: boolean;
		ontoggleedit: () => void;
		onsave: () => void;
		onarchive?: () => void;
	}

	let {
		isEditing,
		saving = false,
		canEdit = true,
		canArchive = true,
		ontoggleedit,
		onsave,
		onarchive
	}: Props = $props();
</script>

<aside class="h-fit rounded-lg border bg-background lg:sticky lg:top-6 lg:w-72 lg:shrink-0">
	<div class="px-5 py-4">
		<h3 class="text-sm font-semibold">Actions</h3>
	</div>
	<Separator />
	<div class="flex flex-col gap-2 p-4">
		{#if isEditing}
			<Button variant="default" size="sm" class="w-full gap-1.5" onclick={onsave} disabled={saving}>
				{#if saving}
					<Loader2 class="size-3.5 animate-spin" />
					Saving…
				{:else}
					<Save class="size-3.5" />
					Save Changes
				{/if}
			</Button>
			<Button
				variant="outline"
				size="sm"
				class="w-full gap-1.5"
				onclick={ontoggleedit}
				disabled={saving}
			>
				<X class="size-3.5" />
				Cancel
			</Button>
		{:else}
			<Button
				variant="outline"
				size="sm"
				class="w-full gap-1.5"
				onclick={ontoggleedit}
				disabled={!canEdit}
			>
				<Pencil class="size-3.5" />
				Edit User
			</Button>
			{#if onarchive}
				<Button
					variant="outline"
					size="sm"
					class="w-full gap-1.5 text-destructive hover:text-destructive"
					onclick={onarchive}
					disabled={!canArchive}
				>
					<Archive class="size-3.5" />
					Archive User
				</Button>
			{/if}
		{/if}
	</div>
</aside>
