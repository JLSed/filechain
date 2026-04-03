<script lang="ts">
	import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Drawer from '$lib/shadcn/components/ui/drawer/index';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import MasterPasswordDialog from './MasterPasswordDialog.svelte';
	import FileViewer from './FileViewer.svelte';
	import { formatTimestamp, formatFileSize } from '$lib/utils/formatter';
	import { GitBranch, File, Eye } from '@lucide/svelte';

	interface Props {
		files: FileMetadata[];
		open: boolean;
		onclose: () => void;
	}

	let { files, open = $bindable(), onclose }: Props = $props();

	let container: HTMLDivElement | undefined = $state();
	let isDragging = $state(false);
	let startX = $state(0);
	let scrollLeft = $state(0);

	/** Master password dialog state */
	let selectedFile = $state<FileMetadata | null>(null);
	let passwordDialogOpen = $state(false);

	/** File viewer state */
	let activeFileView = $state<DecryptedFileView | null>(null);

	function handleMouseDown(e: MouseEvent): void {
		if (!container) return;
		isDragging = true;
		startX = e.pageX - container.offsetLeft;
		scrollLeft = container.scrollLeft;
	}

	function handleMouseMove(e: MouseEvent): void {
		if (!isDragging || !container) return;
		e.preventDefault();
		const x = e.pageX - container.offsetLeft;
		const walk = (x - startX) * 1.5;
		container.scrollLeft = scrollLeft - walk;
	}

	function handleMouseUp(): void {
		isDragging = false;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			onclose();
		}
	}

	/**
	 * Truncate a hash string to first N characters with ellipsis.
	 */
	function truncateHash(hash: string | undefined, length: number = 24): string {
		if (!hash) return '—';
		if (hash.length <= length) return hash;
		return `${hash.slice(0, length)}…`;
	}

	/**
	 * Get the uploader's display name from user_profiles.
	 */
	function getUploaderName(file: FileMetadata): string {
		const profile = file.user_profiles;
		if (!profile) return '—';
		return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || '—';
	}

	function handleViewFile(file: FileMetadata): void {
		selectedFile = file;
		passwordDialogOpen = true;
	}

	function handleDecrypted(fileView: DecryptedFileView): void {
		passwordDialogOpen = false;
		selectedFile = null;
		activeFileView = fileView;
	}

	function handlePasswordDialogClose(): void {
		passwordDialogOpen = false;
		selectedFile = null;
	}

	function handleViewerClose(): void {
		if (activeFileView) {
			URL.revokeObjectURL(activeFileView.blobUrl);
		}
		activeFileView = null;
	}
</script>

{#if activeFileView}
	<div class="fixed inset-0 z-50 bg-background">
		<FileViewer fileView={activeFileView} onclose={handleViewerClose} />
	</div>
{/if}

<Drawer.Root bind:open onOpenChange={handleOpenChange} direction="bottom">
	<Drawer.Content class="max-h-[50vh]">
		<Drawer.Header>
			<Drawer.Title class="flex items-center gap-2 text-base">
				<GitBranch class="size-4" />
				Revision History
			</Drawer.Title>
			<Drawer.Description class="text-sm text-muted-foreground">
				{files.length} version{files.length !== 1 ? 's' : ''} in this chain
			</Drawer.Description>
		</Drawer.Header>

		<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
		<div
			bind:this={container}
			class="overflow-x-auto px-6 pt-2 pb-6 {isDragging
				? 'cursor-grabbing select-none'
				: 'cursor-grab'}"
			onmousedown={handleMouseDown}
			onmousemove={handleMouseMove}
			onmouseup={handleMouseUp}
			onmouseleave={handleMouseUp}
			role="region"
			tabindex="-1"
			aria-label="Revision timeline"
		>
			<div class="flex items-start gap-0" style="min-width: max-content;">
				{#each files as file, i (file.file_id)}
					{@const ledger = file.file_ledger?.[0]}
					{@const isLatest = i === files.length - 1}
					{@const isGenesis = i === 0}

					<!-- Revision card -->
					<div class="flex flex-col items-center">
						<!-- Header: date + sequence -->
						<div class="mb-2 flex w-full items-center justify-between gap-4 px-1">
							<span class="text-[11px] text-muted-foreground">
								{formatTimestamp(file.uploaded_at)}
							</span>
							<Badge variant={isLatest ? 'default' : 'secondary'} class="text-[10px] leading-tight">
								{isGenesis ? 'Genesis' : `v${ledger?.sequence ?? i}`}
							</Badge>
						</div>

						<!-- Card -->
						<div
							class="w-56 rounded-lg border p-3 transition-colors
								{isLatest ? 'border-primary/40 bg-primary/5' : 'border-border bg-card hover:bg-muted/50'}"
						>
							<!-- File icon + name -->
							<div class="flex items-center gap-2">
								<div class="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
									<File class="size-4 text-muted-foreground" />
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-sm font-medium text-foreground">
										{file.file_name}
									</p>
									<p class="text-xs text-muted-foreground">
										{formatFileSize(file.size)}
									</p>
								</div>
							</div>

							<!-- Uploader name -->
							<div class="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
								<span class="font-medium">Uploaded by:</span>
								<span class="truncate">{getUploaderName(file)}</span>
							</div>

							<!-- Hash -->
							<div class="mt-2 rounded-md bg-muted/60 px-2 py-1">
								<p class="font-mono text-[11px] leading-relaxed text-muted-foreground">
									{truncateHash(file.file_hash)}
								</p>
							</div>

							<!-- View button -->
							<div class="mt-2 flex justify-end">
								<Button
									variant="ghost"
									size="sm"
									class="h-7 gap-1.5 px-2 text-xs"
									onclick={(e) => {
										e.stopPropagation();
										handleViewFile(file);
									}}
								>
									<Eye class="size-3.5" />
									View
								</Button>
							</div>
						</div>
					</div>

					<!-- Connector line between cards -->
					{#if i < files.length - 1}
						<div class="flex items-center self-center pt-6">
							<div class="h-px w-8 border-t-2 border-dashed border-muted-foreground/30"></div>
							<div
								class="size-2 rounded-full border-2 border-muted-foreground/30 bg-background"
							></div>
							<div class="h-px w-8 border-t-2 border-dashed border-muted-foreground/30"></div>
						</div>
					{/if}
				{/each}
			</div>
		</div>
	</Drawer.Content>
</Drawer.Root>

<MasterPasswordDialog
	file={selectedFile}
	bind:open={passwordDialogOpen}
	ondecrypted={handleDecrypted}
	onclose={handlePasswordDialogClose}
/>
