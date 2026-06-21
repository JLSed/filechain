<script lang="ts">
	import type { PageProps } from './$types';
	import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
	import ApplicationSection from '$lib/components/admin/files/client/ApplicationSection.svelte';
	import MasterPasswordDialog from '$lib/components/admin/files/client/MasterPasswordDialog.svelte';
	import AddRevisionDialog from '$lib/components/admin/files/client/AddRevisionDialog.svelte';
	import RevisionDrawer from '$lib/components/admin/files/client/RevisionDrawer.svelte';
	import VerifyIntegrityDialog from '$lib/components/admin/files/client/VerifyIntegrityDialog.svelte';
	import ViewAccessDialog from '$lib/components/admin/files/client/ViewAccessDialog.svelte';
	import ShareFileDialog from '$lib/components/admin/files/client/ShareFileDialog.svelte';
	import SharePasswordDialog from '$lib/components/admin/files/client/SharePasswordDialog.svelte';
	import FileViewer from '$lib/components/admin/files/client/FileViewer.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, ArrowLeft } from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';

	let { data }: PageProps = $props();

	import { page } from '$app/stores';
	import { hasPermission } from '$lib/services/permissions';

	const permissions = $derived($page.data.permissions as string[]);
	const canDownload = $derived(hasPermission(permissions, 'files.download'));
	const canRevision = $derived(hasPermission(permissions, 'files.revision'));

	const personalName = $derived(
		[data.client.first_name, data.client.middle_name, data.client.last_name]
			.filter(Boolean)
			.join(' ')
	);
	const clientName = $derived(
		data.client.is_individual
			? personalName || '—'
			: data.client.company_name?.trim() || personalName || '—'
	);

	const currentUserId = $derived(data.profile.user_id);

	let selectedFile = $state<FileMetadata | null>(null);
	let dialogOpen = $state(false);
	let activeFileView = $state<DecryptedFileView | null>(null);

	let revisionFile = $state<FileMetadata | null>(null);
	let revisionDialogOpen = $state(false);
	let revisionTeam = $state<string | null>(null);

	let revisionChain = $state<FileMetadata[]>([]);
	let revisionDrawerOpen = $state(false);

	let verifyFile = $state<FileMetadata | null>(null);
	let verifyDialogOpen = $state(false);

	let accessFile = $state<FileMetadata | null>(null);
	let accessDialogOpen = $state(false);

	let shareFile = $state<FileMetadata | null>(null);
	let shareDialogOpen = $state(false);
	let sharePasswordDialogOpen = $state(false);
	let shareSelectedUsers = $state<
		Array<{
			user_id: string;
			first_name: string | null;
			last_name: string | null;
			email: string | null;
			role: string | null;
			public_key: string;
		}>
	>([]);

	/**
	 * Returns only the newest file (highest sequence) per revision chain.
	 * A file is the newest if no other file's previous_block points to its block_id.
	 */
	function getFilesForApplication(applicationId: string): FileMetadata[] {
		const appFiles = data.files.filter((f) => f.application_id === applicationId);

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
		const allFiles = data.files.filter((f) => f.application_id === file.application_id);

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
		const app = data.applications.find((a) => a.application_id === file.application_id);
		revisionTeam = app?.team_assigned ?? null;
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
		revisionTeam = null;
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

	function handleViewAccess(file: FileMetadata): void {
		accessFile = file;
		accessDialogOpen = true;
	}

	function handleAccessDialogClose(): void {
		accessDialogOpen = false;
		accessFile = null;
	}

	function handleShare(file: FileMetadata): void {
		shareFile = file;
		shareDialogOpen = true;
	}

	function handleShareConfirm(file: FileMetadata, selectedUsers: typeof shareSelectedUsers): void {
		shareDialogOpen = false;
		shareSelectedUsers = selectedUsers;
		sharePasswordDialogOpen = true;
	}

	function handleShareDialogClose(): void {
		shareDialogOpen = false;
		shareFile = null;
	}

	function handleShareCompleted(): void {
		sharePasswordDialogOpen = false;
		shareFile = null;
		shareSelectedUsers = [];
		invalidate('db:client-files');
	}

	function handleSharePasswordDialogClose(): void {
		sharePasswordDialogOpen = false;
		shareSelectedUsers = [];
	}
</script>

{#if activeFileView}
	<div class="h-full">
		<FileViewer fileView={activeFileView} {canDownload} onclose={handleViewerClose} />
	</div>
{:else}
	<main class="p-4">
		<div class="mb-6 flex items-center gap-3">
			<Button variant="outline" size="icon" href="/files">
				<ArrowLeft class="size-4" />
			</Button>
			<div>
				<h1 class="text-lg font-semibold">{clientName}</h1>
				{#if !data.client.is_individual && data.client.company_name}
					<p class="text-sm text-muted-foreground">{data.client.company_name}</p>
				{/if}
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
				{#each data.applications as app (app.application_id)}
					<ApplicationSection
						{app}
						files={getFilesForApplication(app.application_id)}
						{currentUserId}
						accessibleFileIds={data.accessibleFileIds}
						{canRevision}
						onfileclick={handleFileClick}
						onshare={handleShare}
						onaddrevision={handleAddRevision}
						onviewrevisions={handleViewRevisions}
						onverifyintegrity={handleVerifyIntegrity}
						onviewaccess={handleViewAccess}
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
	applicationTeam={revisionTeam}
	bind:open={revisionDialogOpen}
	onuploaded={handleRevisionUploaded}
	onclose={handleRevisionDialogClose}
/>

<RevisionDrawer
	files={revisionChain}
	accessibleFileIds={data.accessibleFileIds}
	bind:open={revisionDrawerOpen}
	onclose={handleRevisionDrawerClose}
	onshare={handleShare}
	onviewaccess={handleViewAccess}
/>

<VerifyIntegrityDialog
	file={verifyFile}
	bind:open={verifyDialogOpen}
	onclose={handleVerifyDialogClose}
/>

<ViewAccessDialog
	file={accessFile}
	bind:open={accessDialogOpen}
	onclose={handleAccessDialogClose}
/>

<ShareFileDialog
	file={shareFile}
	bind:open={shareDialogOpen}
	onconfirm={handleShareConfirm}
	onclose={handleShareDialogClose}
/>

<SharePasswordDialog
	file={shareFile}
	selectedUsers={shareSelectedUsers}
	bind:open={sharePasswordDialogOpen}
	onshared={handleShareCompleted}
	onclose={handleSharePasswordDialogClose}
/>
