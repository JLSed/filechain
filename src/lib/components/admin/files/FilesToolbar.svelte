<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ChevronDown } from '@lucide/svelte';

	interface Props {
		sortDirection: 'asc' | 'desc';
		onToggleSort: () => void;
	}

	let { sortDirection, onToggleSort }: Props = $props();
</script>

<div class="flex flex-col gap-4">
	<div class="flex flex-wrap gap-2">
		<Button variant="outline" size="sm" class="gap-1 rounded-full">
			Type <ChevronDown class="size-3" />
		</Button>
		<Button variant="outline" size="sm" class="gap-1 rounded-full">
			People <ChevronDown class="size-3" />
		</Button>
		<Button variant="outline" size="sm" class="gap-1 rounded-full">
			Modified <ChevronDown class="size-3" />
		</Button>
		<Button variant="outline" size="sm" class="gap-1 rounded-full">
			Source <ChevronDown class="size-3" />
		</Button>
	</div>
	<button class="flex w-fit items-center gap-1 text-sm font-medium" onclick={onToggleSort}>
		Name
		<span class="text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
	</button>
</div>
