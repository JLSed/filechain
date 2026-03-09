<script lang="ts" generics="T extends Record<string, unknown>">
	import type { TableState } from '$lib/classes/TableClass.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';

	interface PageProps {
		table: TableState<T>;
	}
	let { table }: PageProps = $props();
</script>

<div>
	{#if table.totalRows > 0}
		<div class="flex items-center justify-between">
			<div>
				<p class="text-sm text-muted-foreground">
					Page {table.currentPage} of {table.maxRowPerPage}
				</p>
			</div>
			<div class="flex gap-2">
				<Button
					variant="outline"
					size="sm"
					disabled={table.currentPage === 1}
					onclick={() => table.goToPage(table.currentPage - 1)}
				>
					<ChevronLeft class="size-4" />
					Previous
				</Button>
				<div>
					{#each table.pageNumbers as number, i (i)}
						{#if number === '...'}
							<span class="px-2 text-sm text-muted-foreground">...</span>
						{/if}
						<Button
							size="sm"
							variant={number === table.currentPage ? 'default' : 'outline'}
							onclick={() => table.goToPage(number as number)}
						>
							{number}
						</Button>
					{/each}
				</div>
				<Button
					variant="outline"
					size="sm"
					disabled={table.currentPage >= table.maxRowPerPage}
					onclick={() => table.goToPage(table.currentPage + 1)}
				>
					Next
					<ChevronRight class="size-4" />
				</Button>
			</div>
		</div>
	{/if}
</div>
