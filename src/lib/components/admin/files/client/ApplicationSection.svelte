<script lang="ts">
	import type { FileMetadata, IpApplication } from '$lib/types/DatabaseTypes';
	import * as Collapsible from '$lib/shadcn/components/ui/collapsible/index';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import FileRow from './FileRow.svelte';
	import { ChevronDown, SlidersHorizontal } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';

	interface Props {
		app: IpApplication;
		files: FileMetadata[];
		currentUserId: string;
		onfileclick: (file: FileMetadata) => void;
	}

	let { app, files, currentUserId, onfileclick }: Props = $props();
	let open = $state(true);
</script>

<Collapsible.Root bind:open>
	<div class="flex items-center justify-between border-b-2 px-4 py-3">
		<Collapsible.Trigger class="flex flex-1 items-center gap-2 text-left">
			<ChevronDown class="size-4 shrink-0 transition-transform {open ? '' : '-rotate-90'}" />
			<span class="text-sm font-semibold">{app.title_of_invention}</span>
			<div class="rounded-md border-2 px-2">
				<span class="text-xs text-muted-foreground">{app.application_number}</span>
			</div>

			<span class="hidden text-xs text-muted-foreground sm:inline">{app.status}</span>

			<div class="flex items-center gap-4 text-xs font-medium text-muted-foreground">
				<Button variant="outline" size="sm" class="text-xs">View Details</Button>
			</div>
		</Collapsible.Trigger>
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
						<Table.Cell class="text-xs">File Name</Table.Cell>
						<Table.Cell class="text-center text-xs">Uploader</Table.Cell>
						<Table.Cell class="text-center text-xs">Date Uploaded</Table.Cell>
						<Table.Cell class="text-center text-xs">File Size</Table.Cell>
						<Table.Cell>
							<Button variant="ghost" size="icon" class="size-7">
								<SlidersHorizontal class="size-3.5" />
							</Button>
						</Table.Cell>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each files as file (file.file_id)}
						<FileRow {file} {currentUserId} {onfileclick} />
					{/each}
				</Table.Body>
			</Table.Root>
		{/if}
	</Collapsible.Content>
</Collapsible.Root>
