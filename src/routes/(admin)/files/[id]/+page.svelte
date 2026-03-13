<script lang="ts">
	import type { PageProps } from './$types';
	import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
	import ApplicationSection from '$lib/components/admin/files/client/ApplicationSection.svelte';
	import MasterPasswordDialog from '$lib/components/admin/files/client/MasterPasswordDialog.svelte';
	import AddRevisionDialog from '$lib/components/admin/files/client/AddRevisionDialog.svelte';
	import RevisionDrawer from '$lib/components/admin/files/client/RevisionDrawer.svelte';
	import VerifyIntegrityDialog from '$lib/components/admin/files/client/VerifyIntegrityDialog.svelte';
	import FileViewer from '$lib/components/admin/files/client/FileViewer.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, ArrowLeft } from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';

	let { data }: PageProps = $props();

	const clientName = $derived(
		[data.client.first_name, data.client.middle_name, data.client.last_name]
			.filter(Boolean)
			.join(' ')
	);

	const currentUserId = $derived(data.profile.user_id);

	let selectedFile = $state<FileMetadata | null>(null);
	let dialogOpen = $state(false);
	let activeFileView = $state<DecryptedFileView | null>(null);

	let revisionFile = $state<FileMetadata | null>(null);
	let revisionDialogOpen = $state(false);

	let revisionChain = $state<FileMetadata[]>([]);
	let revisionDrawerOpen = $state(false);

	let verifyFile = $state<FileMetadata | null>(null);
	let verifyDialogOpen = $state(false);

	/**
	 * Returns only the newest file (highest sequence) per revision chain.
	 * A file is the newest if no other file's previous_block points to its block_id.
	 */
	function getFilesForApplication(applicationNumber: string): FileMetadata[] {
		const appFiles = data.files.filter((f) => f.application_number === applicationNumber);

		// Collect all block_ids that are referenced as previous_block by another file
		const referencedBlockIds = new SvelteSet<string>();
		for (const f of appFiles) {
			const ledger = f.file_ledger?.[0];
			if (ledger?.previous_block) {
				referencedBlockIds.add(ledger.previous_block);
			}
		}

		// A file is "newest" if its block_id is NOT in the referenced set
		return appFiles.filter((f) => {
			const blockId = f.file_ledger?.[0]?.block_id;
			if (!blockId) return true;
			return !referencedBlockIds.has(blockId);
		});
	}

	/**
	 * Builds the full revision chain for a file by walking previous_block links.
	 * Returns an array ordered from oldest (genesis, seq 0) to newest.
	 */
	function buildRevisionChain(file: FileMetadata): FileMetadata[] {
		const allFiles = data.files.filter(
			(f) => f.application_number === file.application_number
		);

		// Build a map: block_id -> FileMetadata
		const blockIdToFile = new SvelteMap<string, FileMetadata>();
		for (const f of allFiles) {
			const blockId = f.file_ledger?.[0]?.block_id;
			if (blockId) blockIdToFile.set(blockId, f);
		}

		// Walk backward from the selected file through previous_block
		const chain: FileMetadata[] = [file];
		let current = file;
		while (current.file_ledger?.[0]?.previous_block) {
			const prev = blockIdToFile.get(current.file_ledger[0].previous_block);
			if (!prev) break;
			chain.unshift(prev);
			current = prev;
		}

		return chain;
	}

	function handleFileClick(file: FileMetadata): void {
		selectedFile = file;
		dialogOpen = true;
	}

	function handleDecrypted(fileView: DecryptedFileView): void {
		dialogOpen = false;
		selectedFile = null;
		activeFileView = fileView;
	}

	function handleDialogClose(): void {
		dialogOpen = false;
		selectedFile = null;
	}

	function handleViewerClose(): void {
		if (activeFileView) {
			URL.revokeObjectURL(activeFileView.blobUrl);
		}
		activeFileView = null;
	}

	function handleAddRevision(file: FileMetadata): void {
		revisionFile = file;
		revisionDialogOpen = true;
	}

	function handleRevisionUploaded(): void {
		revisionDialogOpen = false;
		revisionFile = null;
		invalidate('db:client-files');
	}

	function handleRevisionDialogClose(): void {
		revisionDialogOpen = false;
		revisionFile = null;
	}

	function handleViewRevisions(file: FileMetadata): void {
		revisionChain = buildRevisionChain(file);
		revisionDrawerOpen = true;
	}

	function handleRevisionDrawerClose(): void {
		revisionDrawerOpen = false;
		revisionChain = [];
	}

	function handleVerifyIntegrity(file: FileMetadata): void {
		verifyFile = file;
		verifyDialogOpen = true;
	}

	function handleVerifyDialogClose(): void {
		verifyDialogOpen = false;
		verifyFile = null;
	}
</script>

{#if activeFileView}
	<div class="h-full">
		<FileViewer fileView={activeFileView} onclose={handleViewerClose} />
	</div>
{:else}
	<main class="p-4">
		<div class="mb-6 flex items-center gap-3">
			<Button variant="outline" size="icon" href="/files">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{clientName}</h1>
				<p class="text-sm text-muted-foreground">{data.client.company_name}</p>
			</div>
		</div>

		{#if data.error}
			<div class="flex flex-col items-center justify-center space-y-3 py-12 text-center">
				<AlertCircle class="size-8 text-primary/70" />
				<p class="text-sm font-medium text-primary/60">{data.error}</p>
			</div>
		{:else if data.applications.length === 0}
			<p class="py-12 text-center text-muted-foreground">No applications found for this client.</p>
		{:else}
			<div class="flex flex-col">
				{#each data.applications as app (app.application_number)}
					<ApplicationSection
						{app}
						files={getFilesForApplication(app.application_number)}
						{currentUserId}
						onfileclick={handleFileClick}
						onaddrevision={handleAddRevision}
						onviewrevisions={handleViewRevisions}
						onverifyintegrity={handleVerifyIntegrity}
					/>
				{/each}
			</div>
		{/if}
	</main>
{/if}

<MasterPasswordDialog
	file={selectedFile}
	bind:open={dialogOpen}
	ondecrypted={handleDecrypted}
	onclose={handleDialogClose}
/>

<AddRevisionDialog
	file={revisionFile}
	bind:open={revisionDialogOpen}
	onuploaded={handleRevisionUploaded}
	onclose={handleRevisionDialogClose}
/>

<RevisionDrawer
	files={revisionChain}
	bind:open={revisionDrawerOpen}
	onclose={handleRevisionDrawerClose}
/>

<VerifyIntegrityDialog
	file={verifyFile}
	bind:open={verifyDialogOpen}
	onclose={handleVerifyDialogClose}
/>
