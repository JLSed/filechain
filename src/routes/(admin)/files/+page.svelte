<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { Input } from '$lib/shadcn/components/ui/input/index.js';
	import { Search, FolderOpen, Loader2 } from '@lucide/svelte';
	import ClientFolder from '$lib/components/files/ClientFolder.svelte';
	import ApplicationDetail from '$lib/components/client-patenting/ApplicationDetail.svelte';
	import FileDecryptionDialog from '$lib/components/files/FileDecryptionDialog.svelte';
	import FileViewer from '$lib/components/files/FileViewer.svelte';
	import type { ClientApplicationRow } from './+page.server';
	import type { StorageFile } from '../patenting/client/files/+server';
	import type { IpApplicationStatus } from '$lib/types/ip-application';
	import type { DecryptedFileView } from '$lib/types/file';

	let { data } = $props();

	let searchValue = $state('');

	// ── Sheet state ──
	let sheetOpen = $state(false);
	let selectedApp = $state<ClientApplicationRow | null>(null);
	let files = $state<StorageFile[]>([]);
	let filesLoading = $state(false);
	let filesError = $state<string | null>(null);

	// ── File decryption dialog state ──
	let decryptDialogOpen = $state(false);
	let decryptFileName = $state('');
	let decryptFolderPath = $state('');

	// ── File viewer state ──
	let activeFileView = $state<DecryptedFileView | null>(null);

	$effect(() => {
		searchValue = data.search;
	});

	function updateParams(updates: Record<string, string | number>) {
		const params = new URLSearchParams($page.url.searchParams);
		for (const [key, value] of Object.entries(updates)) {
			if (value === '' || value === null || value === undefined) {
				params.delete(key);
			} else {
				params.set(key, String(value));
			}
		}
		goto(`?${params.toString()}`, { replaceState: true, keepFocus: true });
	}

	function handleSearch() {
		updateParams({ search: searchValue });
	}

	function handleSearchKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') handleSearch();
	}

	async function openDetails(app: ClientApplicationRow) {
		selectedApp = app;
		sheetOpen = true;

		if (app.link_to_folder) {
			filesLoading = true;
			filesError = null;
			files = [];

			try {
				const res = await fetch(
					`/patenting/client/files?path=${encodeURIComponent(app.link_to_folder)}`
				);
				if (!res.ok) throw new Error('Failed to load files');
				const json = await res.json();
				files = json.files as StorageFile[];
			} catch (err) {
				filesError = err instanceof Error ? err.message : 'Unknown error';
			} finally {
				filesLoading = false;
			}
		} else {
			files = [];
		}
	}

	function openFileDecrypt(fileName: string, folderPath: string) {
		decryptFileName = fileName;
		decryptFolderPath = folderPath;
		decryptDialogOpen = true;
	}

	function handleDecrypted(view: DecryptedFileView) {
		decryptDialogOpen = false;
		activeFileView = view;
	}

	function closeFileViewer() {
		if (activeFileView) {
			URL.revokeObjectURL(activeFileView.blobUrl);
		}
		activeFileView = null;
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getClientName(app: ClientApplicationRow): string {
		const parts = [app.client_first_name, app.client_last_name].filter(Boolean);
		return parts.length > 0 ? parts.join(' ') : '—';
	}

	type StatusConfig = { dot: string; badge: string };

	const STATUS_STYLES: Record<IpApplicationStatus, StatusConfig> = {
		Assigned: { dot: 'bg-blue-500', badge: 'text-blue-700 border-blue-200 bg-blue-50' },
		Extended: { dot: 'bg-amber-500', badge: 'text-amber-700 border-amber-200 bg-amber-50' },
		Submitted: { dot: 'bg-violet-500', badge: 'text-violet-700 border-violet-200 bg-violet-50' },
		'For Pickup': {
			dot: 'bg-emerald-500',
			badge: 'text-emerald-700 border-emerald-200 bg-emerald-50'
		},
		Closed: { dot: 'bg-slate-400', badge: 'text-slate-600 border-slate-200 bg-slate-50' }
	};

	function getStatusStyle(status: IpApplicationStatus): StatusConfig {
		return (
			STATUS_STYLES[status] ?? {
				dot: 'bg-slate-400',
				badge: 'text-slate-600 border-slate-200 bg-slate-50'
			}
		);
	}
</script>

{#if activeFileView}
	<!-- File viewer replaces page content but keeps sidebar/nav visible -->
	<FileViewer fileView={activeFileView} onclose={closeFileViewer} />
{:else}
	<div class="flex flex-col gap-6 p-6">
		<!-- Header -->
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-2xl font-bold">File Management</h1>
				<p class="mt-1 text-muted-foreground">Browse and manage client files.</p>
			</div>
		</div>

		<!-- Count + Search -->
		<div class="flex items-center justify-between gap-4">
			<div class="flex items-center gap-2">
				<FolderOpen class="size-5 text-amber-500" />
				<h2 class="text-lg font-semibold">Client Folders</h2>
				<span class="text-lg text-muted-foreground">{data.clientFolders.length}</span>
			</div>

			<div class="relative">
				<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					type="search"
					placeholder="Search applications…"
					class="w-60 pl-9"
					bind:value={searchValue}
					onkeydown={handleSearchKeydown}
				/>
			</div>
		</div>

		<!-- Client Folders -->
		{#if data.clientFolders.length === 0}
			<div
				class="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center"
			>
				<FolderOpen class="size-10 text-muted-foreground/40" />
				<p class="mt-3 text-sm text-muted-foreground">No client folders found.</p>
				{#if data.search}
					<p class="mt-1 text-xs text-muted-foreground">Try adjusting your search query.</p>
				{/if}
			</div>
		{:else}
			<div class="flex flex-col gap-3">
				{#each data.clientFolders as folder (folder.clientId)}
					<ClientFolder {folder} onViewDetails={openDetails} onViewFile={openFileDecrypt} />
				{/each}
			</div>
		{/if}
	</div>
{/if}

<!-- ── Application Details Sheet ── -->
<ApplicationDetail
	bind:sheetOpen
	{filesLoading}
	{filesError}
	{selectedApp}
	{getStatusStyle}
	{getClientName}
	{formatDate}
	{files}
/>

<!-- ── File Decryption Dialog ── -->
<FileDecryptionDialog
	fileName={decryptFileName}
	folderPath={decryptFolderPath}
	bind:open={decryptDialogOpen}
	onclose={() => (decryptDialogOpen = false)}
	onDecrypted={handleDecrypted}
/>
