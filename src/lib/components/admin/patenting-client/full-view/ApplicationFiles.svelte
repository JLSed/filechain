<script lang="ts">
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import * as Tooltip from '$lib/shadcn/components/ui/tooltip/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { formatDate, formatFileSize } from '$lib/utils/formatter';
	import {
		File,
		EllipsisVertical,
		Plus,
		Upload,
		Share2,
		ShieldCheck,
		Pencil,
		History,
		Archive,
		LockKeyhole,
		Users
	} from '@lucide/svelte';
	import { mergeProps } from 'bits-ui';

	interface Props {
		files: FileMetadata[];
		currentUserId: string;
		accessibleFileIds: string[];
		isEditing: boolean;
		canUpload?: boolean;
		canRevision?: boolean;
		onfileclick: (file: FileMetadata) => void;
		onshare: (file: FileMetadata) => void;
		onaddrevision: (file: FileMetadata) => void;
		onviewrevisions: (file: FileMetadata) => void;
		onverifyintegrity: (file: FileMetadata) => void;
		onviewaccess: (file: FileMetadata) => void;
		onaddfile: () => void;
		onshareall: () => void;
	}

	let {
		files,
		currentUserId,
		accessibleFileIds,
		isEditing,
		canUpload = true,
		canRevision = true,
		onfileclick,
		onshare,
		onaddrevision,
		onviewrevisions,
		onverifyintegrity,
		onviewaccess,
		onaddfile,
		onshareall
	}: Props = $props();

	const accessibleSet = $derived(new Set(accessibleFileIds));

	function getVersion(file: FileMetadata): string | null {
		return file.file_ledger && file.file_ledger.length > 0
			? `v${file.file_ledger[0].sequence}`
			: null;
	}

	function getUploaderName(file: FileMetadata): string {
		if (file.uploader_id === currentUserId) {
			if (file.user_profiles) return 'You';
		}
		if (file.user_profiles) {
			return `${file.user_profiles.first_name} ${file.user_profiles.last_name}`;
		}
		return '—';
	}
</script>

{#snippet RowContent(
	file: FileMetadata,
	hasAccess: boolean,
	triggerProps: Record<string, unknown> = {}
)}
	<Table.Row
		{...triggerProps}
		class={mergeProps(triggerProps, {
			class: `group cursor-pointer hover:bg-muted/50 ${
				!hasAccess ? 'cursor-help bg-red-500/5 hover:bg-red-500/10' : ''
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
			{#if getVersion(file)}
				<Badge variant="secondary" class="text-[10px] leading-tight">{getVersion(file)}</Badge>
			{/if}
		</Table.Cell>
		<Table.Cell class="hidden w-36 text-center text-sm text-muted-foreground sm:table-cell">
			{getUploaderName(file)}
		</Table.Cell>
		<Table.Cell class="hidden w-28 text-center text-sm text-muted-foreground sm:table-cell">
			{formatDate(file.uploaded_at)}
		</Table.Cell>
		<Table.Cell class="hidden w-20 text-center text-sm text-muted-foreground sm:table-cell">
			{formatFileSize(file.size)}
		</Table.Cell>
		<Table.Cell class="w-10 pr-4">
			<div class="flex items-center gap-1">
				{#if isEditing && canRevision}
					<button
						class="rounded-md p-1 text-xs transition-opacity hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
						aria-label="Add revision"
						disabled={!hasAccess}
						onclick={(e) => {
							e.stopPropagation();
							onaddrevision(file);
						}}
					>
						<Upload class="size-3.5" />
					</button>
				{/if}
				<DropdownMenu.Root>
					<DropdownMenu.Trigger disabled={!hasAccess}>
						<button
							class="rounded-md p-1 transition-opacity hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
							aria-label="File options"
							disabled={!hasAccess}
						>
							<EllipsisVertical class="size-4" />
						</button>
					</DropdownMenu.Trigger>
					<DropdownMenu.Content align="end">
						<DropdownMenu.Item
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								onshare(file);
							}}><Share2 /> Share</DropdownMenu.Item
						>
						<DropdownMenu.Item
							disabled={!canRevision}
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
						<DropdownMenu.Item
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								onviewaccess(file);
							}}><Users /> View Access</DropdownMenu.Item
						>
						<DropdownMenu.Separator />
						<DropdownMenu.Item><Archive /> Archive File</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Root>
			</div>
		</Table.Cell>
	</Table.Row>
{/snippet}

<section>
	<div class="mb-4 flex items-center justify-between">
		<h3 class="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
			Application Files
		</h3>
		<div class="flex items-center gap-2">
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={onshareall}
				disabled={files.length === 0}
			>
				<Share2 class="size-3.5" />
				Share All Files
			</Button>
			<Button
				variant="outline"
				size="sm"
				class="gap-1.5 text-xs"
				onclick={onaddfile}
				disabled={!canUpload}
			>
				<Plus class="size-3.5" />
				Add New File
			</Button>
		</div>
	</div>

	{#if files.length === 0}
		<div class="rounded-lg border border-dashed py-10 text-center">
			<File class="mx-auto mb-2 size-8 text-muted-foreground/50" />
			<p class="text-sm text-muted-foreground">No files uploaded for this application.</p>
		</div>
	{:else}
		<div class="rounded-lg border">
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head class="pl-4 text-xs">File Name</Table.Head>
						<Table.Head class="hidden text-center text-xs sm:table-cell">Uploader</Table.Head>
						<Table.Head class="hidden text-center text-xs sm:table-cell">Date</Table.Head>
						<Table.Head class="hidden text-center text-xs sm:table-cell">Size</Table.Head>
						<Table.Head class="w-10"></Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each files as file (file.file_id)}
						{@const hasAccess = accessibleSet.has(file.file_id)}
						{#if !hasAccess}
							<Tooltip.Root>
								<Tooltip.Trigger>
									{#snippet child({ props })}
										{@render RowContent(file, hasAccess, props)}
									{/snippet}
								</Tooltip.Trigger>
								<Tooltip.Content side="top">
									<p class="max-w-56 text-xs text-balance">
										You don't have access to this file. Request an access key from users who have
										access.
									</p>
								</Tooltip.Content>
							</Tooltip.Root>
						{:else}
							{@render RowContent(file, hasAccess)}
						{/if}
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}
</section>
