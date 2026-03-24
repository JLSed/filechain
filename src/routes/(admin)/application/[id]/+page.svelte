<script lang="ts">
	import type { PageProps } from './$types';
	import type { DecryptedFileView, FileMetadata } from '$lib/types/DatabaseTypes';
	import ApplicationDetails from '$lib/components/admin/patenting-client/full-view/ApplicationDetails.svelte';
	import ApplicationFiles from '$lib/components/admin/patenting-client/full-view/ApplicationFiles.svelte';
	import ActionPanel from '$lib/components/admin/patenting-client/full-view/ActionPanel.svelte';
	import MasterPasswordDialog from '$lib/components/admin/files/client/MasterPasswordDialog.svelte';
	import AddRevisionDialog from '$lib/components/admin/files/client/AddRevisionDialog.svelte';
	import AddFileDialog from '$lib/components/admin/files/client/AddFileDialog.svelte';
	import RevisionDrawer from '$lib/components/admin/files/client/RevisionDrawer.svelte';
	import VerifyIntegrityDialog from '$lib/components/admin/files/client/VerifyIntegrityDialog.svelte';
	import FileViewer from '$lib/components/admin/files/client/FileViewer.svelte';
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { ArrowLeft } from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { SvelteSet, SvelteMap } from 'svelte/reactivity';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { toast } from 'svelte-sonner';

	let { data }: PageProps = $props();

	const app = $derived(data.application);
	const clientName = $derived(
		[app.client_profiles?.first_name, app.client_profiles?.last_name].filter(Boolean).join(' ') ||
			'—'
	);

	// Edit state
	let isEditing = $state(false);
	let saving = $state(false);

	/** Build a fresh editData snapshot from the current application. */
	function buildEditData() {
		return {
			title_of_invention: app.title_of_invention,
			type_of_invention_id: app.type_of_invention?.id ?? null,
			pre_protection_status_id: app.pre_protection_status?.id ?? null,
			type_of_office_action_id: app.type_of_office_action?.id ?? null,
			team_assigned: app.team_assigned ?? null,
			inventor_names: app.inventor_names?.join(', ') ?? '',
			contact_details: app.contact_details ?? '',
			filling_date: app.filling_date ?? null,
			deadline: app.deadline ?? null,
			mailing_date: app.mailing_date ?? null,
			publication_date: app.publication_date ?? null,
			paper_document_no: app.paper_document_no ?? '',
			fees: app.fees ?? null,
			remarks: app.remarks ?? ''
		};
	}

	let editData = $state(buildEditData());

	function toggleEdit(): void {
		if (!isEditing) {
			// Entering edit mode: snapshot current data
			editData = buildEditData();
		}
		isEditing = !isEditing;
	}

	async function handleSave(): Promise<void> {
		saving = true;
		try {
			const supabase = createBrowserClient();

			const updatePayload: Record<string, unknown> = {
				title_of_invention: editData.title_of_invention,
				type_of_invention_id: editData.type_of_invention_id,
				pre_protection_status_id: editData.pre_protection_status_id,
				type_of_office_action_id: editData.type_of_office_action_id,
				team_assigned: editData.team_assigned,
				inventor_names: editData.inventor_names
					.split(',')
					.map((n) => n.trim())
					.filter(Boolean),
				contact_details: editData.contact_details || null,
				filling_date: editData.filling_date || null,
				deadline: editData.deadline || null,
				mailing_date: editData.mailing_date || null,
				publication_date: editData.publication_date || null,
				paper_document_no: editData.paper_document_no || null,
				fees: editData.fees,
				remarks: editData.remarks || null
			};

			const { error } = await supabase
				.schema('api')
				.from('ip_applications')
				.update(updatePayload)
				.eq('application_number', app.application_number);

			if (error) {
				toast.error(`Failed to save: ${error.message}`);
				return;
			}

			toast.success('Application updated successfully.');
			isEditing = false;
			await invalidate('db:application-detail');
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'An unexpected error occurred while saving.'
			);
		} finally {
			saving = false;
		}
	}

	// File interaction state
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

	// Add file dialog state
	let addFileDialogOpen = $state(false);

	/**
	 * Returns only the newest file (highest sequence) per revision chain.
	 */
	function getLatestFiles(): FileMetadata[] {
		const allFiles = data.files;
		const referencedBlockIds = new SvelteSet<string>();
		for (const f of allFiles) {
			const ledger = f.file_ledger?.[0];
			if (ledger?.previous_block) {
				referencedBlockIds.add(ledger.previous_block);
			}
		}
		return allFiles.filter((f) => {
			const blockId = f.file_ledger?.[0]?.block_id;
			if (!blockId) return true;
			return !referencedBlockIds.has(blockId);
		});
	}

	/**
	 * Builds the full revision chain for a file.
	 */
	function buildRevisionChain(file: FileMetadata): FileMetadata[] {
		const allFiles = data.files;
		const blockIdToFile = new SvelteMap<string, FileMetadata>();
		for (const f of allFiles) {
			const blockId = f.file_ledger?.[0]?.block_id;
			if (blockId) blockIdToFile.set(blockId, f);
		}
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
		revisionTeam = app.team_assigned ?? null;
		revisionDialogOpen = true;
	}

	function handleRevisionUploaded(): void {
		revisionDialogOpen = false;
		revisionFile = null;
		invalidate('db:application-detail');
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

	function handleAddFile(): void {
		addFileDialogOpen = true;
	}

	function handleFileUploaded(): void {
		addFileDialogOpen = false;
		invalidate('db:application-detail');
	}

	function handleAddFileDialogClose(): void {
		addFileDialogOpen = false;
	}

	const latestFiles = $derived(getLatestFiles());
</script>

{#if activeFileView}
	<div class="h-full">
		<FileViewer fileView={activeFileView} onclose={handleViewerClose} />
	</div>
{:else}
	<main class="p-4 lg:p-6">
		<!-- Header -->
		<div class="mb-6 flex items-center gap-3">
			<Button variant="outline" size="icon" href="/application">
				<ArrowLeft class="size-4" />
			</Button>
			<div class="flex-1">
				<h1 class="text-lg font-semibold">{app.title_of_invention}</h1>
				<div class="mt-0.5 flex items-center gap-2">
					<span class="text-sm text-muted-foreground">{clientName}</span>
					<span class="text-muted-foreground/40">·</span>
					<Badge variant="outline" class="font-mono text-xs">{app.application_number}</Badge>
				</div>
			</div>
		</div>

		<!-- Main layout: content + action panel -->
		<div class="flex flex-col gap-6 lg:flex-row lg:items-start">
			<!-- Left: Details + Files -->
			<div class="min-w-0 flex-1">
				<div class="rounded-lg border bg-background p-6">
					<ApplicationDetails
						data={app}
						{isEditing}
						inventionTypes={data.inventionTypes}
						protectionStatuses={data.protectionStatuses}
						officeActions={data.officeActions}
						bind:editData
					/>

					<Separator class="my-8" />

					<ApplicationFiles
						files={latestFiles}
						currentUserId={data.profile.user_id}
						{isEditing}
						onfileclick={handleFileClick}
						onaddrevision={handleAddRevision}
						onviewrevisions={handleViewRevisions}
						onverifyintegrity={handleVerifyIntegrity}
						onaddfile={handleAddFile}
					/>
				</div>
			</div>

			<!-- Right: Action Panel -->
			<ActionPanel {isEditing} {saving} ontoggleedit={toggleEdit} onsave={handleSave} />
		</div>
	</main>
{/if}

<!-- Dialogs -->
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

<AddFileDialog
	applicationNumber={app.application_number}
	applicationTeam={app.team_assigned ?? null}
	bind:open={addFileDialogOpen}
	onuploaded={handleFileUploaded}
	onclose={handleAddFileDialogClose}
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
