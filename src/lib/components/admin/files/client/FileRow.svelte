<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { formatDate, formatFileSize } from '$lib/utils/formatter';
	import { File, EllipsisVertical } from '@lucide/svelte';

	interface Props {
		file: FileMetadata;
		currentUserId: string;
		onfileclick: (file: FileMetadata) => void;
		onaddrevision: (file: FileMetadata) => void;
		onviewrevisions: (file: FileMetadata) => void;
		onverifyintegrity: (file: FileMetadata) => void;
	}

	let { file, currentUserId, onfileclick, onaddrevision, onviewrevisions, onverifyintegrity }: Props =
		$props();

	const version = $derived(
		file.file_ledger && file.file_ledger.length > 0 ? `v${file.file_ledger[0].sequence}` : null
	);

	const uploaderName = $derived(() => {
		if (file.uploader_id === currentUserId) {
			if (file.user_profiles) {
				return 'me';
			}
		}
		if (file.user_profiles) {
			return `${file.user_profiles.first_name} ${file.user_profiles.last_name}`;
		}
		return '—';
	});
</script>

<Table.Row class="group cursor-pointer hover:bg-muted/50" onclick={() => onfileclick(file)}>
	<Table.Cell class="flex items-center gap-2 py-3 pl-4">
		<File class="size-4 shrink-0 text-muted-foreground" />
		<span class="truncate text-sm">{file.file_name}</span>
		{#if version}
			<Badge variant="secondary" class="text-[10px] leading-tight">{version}</Badge>
		{/if}
	</Table.Cell>
	<Table.Cell class="hidden w-36 text-center text-sm text-muted-foreground sm:table-cell">
		{uploaderName()}
	</Table.Cell>
	<Table.Cell class="hidden w-28 text-center text-sm text-muted-foreground sm:table-cell">
		{formatDate(file.uploaded_at)}
	</Table.Cell>
	<Table.Cell class="hidden w-20 text-center text-sm text-muted-foreground sm:table-cell">
		{formatFileSize(file.size)}
	</Table.Cell>
	<Table.Cell class="w-10 pr-4">
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				<button class="rounded-md p-1 transition-opacity hover:bg-muted" aria-label="File options">
					<EllipsisVertical class="size-4" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item>Share</DropdownMenu.Item>
				<DropdownMenu.Item
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						onaddrevision(file);
					}}>Add Revision</DropdownMenu.Item
				>
				<DropdownMenu.Item
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						onverifyintegrity(file);
					}}>Verify Integrity</DropdownMenu.Item
				>
				<DropdownMenu.Item>Edit Metadata</DropdownMenu.Item>
				<DropdownMenu.Item
					onclick={(e: MouseEvent) => {
						e.stopPropagation();
						onviewrevisions(file);
					}}
				>View Revisions</DropdownMenu.Item>
				<DropdownMenu.Separator />
				<DropdownMenu.Item>Archive File</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Table.Cell>
</Table.Row>
