<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Collapsible from '$lib/shadcn/components/ui/collapsible/index';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import FileRow from './FileRow.svelte';
	import { ChevronDown, SlidersHorizontal } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';

	interface Props {
		title: string;
		app_num: string;
		files: FileMetadata[];
		currentUserId: string;
	}

	let { title, app_num, files, currentUserId }: Props = $props();
	let open = $state(true);
</script>

<Collapsible.Root bind:open>
	<div class="flex items-center justify-between border-b-2 bg-muted/50 px-4 py-3">
		<Collapsible.Trigger class="flex flex-1 items-center gap-2 text-left">
			<ChevronDown class="size-4 shrink-0 transition-transform {open ? '' : '-rotate-90'}" />
			<span class="text-sm font-semibold">{title}</span>
			<span class="text-sm font-semibold">{app_num}</span>
		</Collapsible.Trigger>
		<div class="flex items-center gap-4 text-xs font-medium text-muted-foreground">
			<span class="hidden w-36 sm:inline">Uploader</span>
			<span class="hidden w-28 sm:inline">Date Uploaded</span>
			<span class="hidden w-20 text-right sm:inline">File Size</span>
		</div>
	</div>

	<Collapsible.Content>
		{#if files.length === 0}
			<p class="px-4 py-6 text-center text-sm text-muted-foreground">
				No files uploaded for this application.
			</p>
		{:else}
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Cell>File Name</Table.Cell>
						<Table.Cell class="text-center">Uploader</Table.Cell>
						<Table.Cell class="text-center">Date Uploaded</Table.Cell>
						<Table.Cell class="text-center">File Size</Table.Cell>
						<Table.Cell>
							<Button variant="ghost" size="icon" class="size-7">
								<SlidersHorizontal class="size-3.5" />
							</Button>
						</Table.Cell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each files as file (file.file_id)}
						<FileRow {file} {currentUserId} />
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Collapsible.Content>
</Collapsible.Root>
