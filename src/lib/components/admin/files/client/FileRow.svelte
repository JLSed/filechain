<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/shadcn/components/ui/tooltip/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { formatDate, formatFileSize } from '$lib/utils/formatter';
	import {
		File,
		EllipsisVertical,
		Share2,
		Upload,
		ShieldCheck,
		Pencil,
		History,
		Archive,
		LockKeyhole
	} from '@lucide/svelte';
	import { mergeProps } from 'bits-ui';

	interface Props {
		file: FileMetadata;
		currentUserId: string;
		hasAccess?: boolean;
		onfileclick: (file: FileMetadata) => void;
		onaddrevision: (file: FileMetadata) => void;
		onviewrevisions: (file: FileMetadata) => void;
		onverifyintegrity: (file: FileMetadata) => void;
	}

	let {
		file,
		currentUserId,
		hasAccess = true,
		onfileclick,
		onaddrevision,
		onviewrevisions,
		onverifyintegrity
	}: Props = $props();

	const version = $derived(
		file.file_ledger && file.file_ledger.length > 0 ? `v${file.file_ledger[0].sequence}` : null
	);

	const uploaderName = $derived(() => {
		if (file.uploader_id === currentUserId) {
			if (file.user_profiles) {
				return 'You';
			}
		}
		if (file.user_profiles) {
			return `${file.user_profiles.first_name} ${file.user_profiles.last_name}`;
		}
		return '—';
	});
</script>

{#snippet RowContent(triggerProps: Record<string, unknown> = {})}
	<Table.Row
		{...triggerProps}
		class={mergeProps(triggerProps, {
			class: `group cursor-pointer hover:bg-muted/50 ${
				!hasAccess ? 'bg-red-500/5 hover:bg-red-500/10 cursor-help' : ''
			}`
		}).class}
		onclick={() => onfileclick(file)}
	>
		<Table.Cell class="flex items-center gap-2 py-3 pl-4">
			{#if !hasAccess}
				<div class="flex items-center justify-center">
					<LockKeyhole class="size-4 shrink-0 text-red-400" />
				</div>
			{:else}
				<File class="size-4 shrink-0 text-muted-foreground" />
			{/if}
			<span class="truncate text-sm {!hasAccess ? 'text-red-400' : ''}">{file.file_name}</span>
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
					<DropdownMenu.Item><Share2 /> Share</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onaddrevision(file);
						}}><Upload /> Add Revision</DropdownMenu.Item
					>
					<DropdownMenu.Item
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onverifyintegrity(file);
						}}><ShieldCheck /> Verify Integrity</DropdownMenu.Item
					>
					<DropdownMenu.Item><Pencil /> Edit Metadata</DropdownMenu.Item>
					<DropdownMenu.Item
						onclick={(e: MouseEvent) => {
							e.stopPropagation();
							onviewrevisions(file);
						}}><History /> View Revisions</DropdownMenu.Item
					>
					<DropdownMenu.Separator />
					<DropdownMenu.Item><Archive /> Archive File</DropdownMenu.Item>
				</DropdownMenu.Content>
			</DropdownMenu.Root>
		</Table.Cell>
	</Table.Row>
{/snippet}

{#if !hasAccess}
	<Tooltip.Root>
		<Tooltip.Trigger>
			{#snippet child({ props })}
				{@render RowContent(props)}
			{/snippet}
		</Tooltip.Trigger>
		<Tooltip.Content side="top">
			<p class="max-w-56 text-xs text-balance">
				You don't have access to this file. Request an access key from users who have access.
			</p>
		</Tooltip.Content>
	</Tooltip.Root>
{:else}
	{@render RowContent()}
{/if}
