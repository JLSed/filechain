<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { formatDate } from '$lib/utils/formatter';
	import { File, Ellipsis } from '@lucide/svelte';

	interface Props {
		file: FileMetadata;
		currentUserId: string;
	}

	let { file, currentUserId }: Props = $props();

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

	function formatFileSize(bytes: number): string {
		if (bytes < 1024) return `${bytes}b`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}kb`;
		return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
	}
</script>

<Table.Row class="group">
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
					<Ellipsis class="size-4" />
				</button>
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="end">
				<DropdownMenu.Item>Share</DropdownMenu.Item>
				<DropdownMenu.Item>Edit File Information</DropdownMenu.Item>
				<DropdownMenu.Item>View Versions</DropdownMenu.Item>
				<DropdownMenu.Item>Archive File</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Table.Cell>
</Table.Row>
