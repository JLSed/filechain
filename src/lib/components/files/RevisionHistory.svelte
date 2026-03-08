<script lang="ts">
	import * as Drawer from '$lib/shadcn/components/ui/drawer/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Separator } from '$lib/shadcn/components/ui/separator/index.js';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import {
		FileStack,
		FileLock,
		Clock,
		Hash,
		HardDrive,
		Loader2,
		AlertCircle,
		X,
		Upload
	} from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import UploadNewVersion from './UploadNewVersion.svelte';

	interface LedgerEntry {
		block_id: string;
		file_id: string;
		file_name: string;
		created_at: string;
		signature: string;
		sequence: number;
		previous_block: string | null;
	}

	interface FileInfo {
		file_id: string | null;
		file_name: string;
		file_hash: string | null;
		file_path: string | null;
		uploaded_at: string | null;
		size: number;
		status: string | null;
	}

	let {
		open = $bindable(false),
		fileName,
		folderPath,
		onVersionUploaded
	}: {
		open: boolean;
		fileName: string;
		folderPath: string;
		onVersionUploaded?: () => void;
	} = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let fileInfo = $state<FileInfo | null>(null);
	let ledgerEntries = $state<LedgerEntry[]>([]);
	let uploadDialogOpen = $state(false);

	$effect(() => {
		if (open && fileName && folderPath) {
			loadRevisionData();
		}
	});

	async function loadRevisionData() {
		loading = true;
		error = null;
		fileInfo = null;
		ledgerEntries = [];

		try {
			const supabase = createBrowserClient();

			// Strip .enc / .encrypted suffix to get the original file name stored in file_metadata
			const originalName = fileName.replace(/\.(enc|encrypted)$/, '');

			// Extract the application number from folderPath
			const appNumber = folderPath.split('/').pop() ?? '';

			// Query ALL file_metadata records in this folder
			const { data: metaRows, error: metaError } = await supabase
				.schema('api')
				.from('file_metadata')
				.select('file_id, file_name, file_hash, file_path, uploaded_at, size, status')
				.ilike('file_path', `%${appNumber}%`)
				.order('uploaded_at', { ascending: false });

			if (metaError) throw new Error(metaError.message);

			// Build a lookup from file_name → metadata
			const metaByName = new SvelteMap<string, (typeof metaRows)[0]>();
			const metaById = new SvelteMap<string, (typeof metaRows)[0]>();
			for (const row of metaRows ?? []) {
				metaByName.set(row.file_name, row);
				metaById.set(row.file_id, row);
			}

			// Find the current file's metadata record
			const currentMeta = metaByName.get(originalName);

			if (!currentMeta) {
				// No metadata record found — show basic info from storage
				fileInfo = {
					file_id: null,
					file_name: fileName,
					file_hash: null,
					file_path: `${folderPath}/${fileName}`,
					uploaded_at: null,
					size: 0,
					status: null
				};
				return;
			}

			// Get ALL ledger entries in this folder for chain traversal
			const allFileIds = (metaRows ?? []).map((v) => v.file_id);

			const { data: allLedgerData, error: ledgerError } = await supabase
				.schema('api')
				.from('file_ledger')
				.select('block_id, file_id, created_at, signature, sequence, previous_block')
				.in('file_id', allFileIds)
				.order('sequence', { ascending: false });

			if (ledgerError) throw new Error(ledgerError.message);

			const allLedger = allLedgerData ?? [];

			// Build lookups for chain traversal
			const ledgerByFileId = new SvelteMap<string, (typeof allLedger)[0]>();
			const ledgerByBlockId = new SvelteMap<string, (typeof allLedger)[0]>();
			const ledgerByPrevBlock = new SvelteMap<string, (typeof allLedger)[0][]>();

			for (const entry of allLedger) {
				if (!ledgerByFileId.has(entry.file_id)) {
					ledgerByFileId.set(entry.file_id, entry);
				}
				ledgerByBlockId.set(entry.block_id, entry);
				if (entry.previous_block) {
					const list = ledgerByPrevBlock.get(entry.previous_block) ?? [];
					list.push(entry);
					ledgerByPrevBlock.set(entry.previous_block, list);
				}
			}

			// Find the connected chain via previous_block links
			const chainFileIds = new SvelteSet<string>();
			const currentLedger = ledgerByFileId.get(currentMeta.file_id);

			if (currentLedger) {
				// Walk backwards through previous_block to find ancestors
				chainFileIds.add(currentLedger.file_id);
				let cursor: (typeof allLedger)[0] | undefined = currentLedger;
				while (cursor?.previous_block) {
					const prev = ledgerByBlockId.get(cursor.previous_block);
					if (!prev || chainFileIds.has(prev.file_id)) break;
					chainFileIds.add(prev.file_id);
					cursor = prev;
				}

				// Walk forwards to find descendants
				const queue = [currentLedger.block_id];
				while (queue.length > 0) {
					const blockId = queue.shift()!;
					const children = ledgerByPrevBlock.get(blockId) ?? [];
					for (const child of children) {
						if (!chainFileIds.has(child.file_id)) {
							chainFileIds.add(child.file_id);
							queue.push(child.block_id);
						}
					}
				}
			} else {
				// No ledger entry yet — just show this file
				chainFileIds.add(currentMeta.file_id);
			}

			// Build version entries from the chain
			const chainMeta = [...chainFileIds]
				.map((fid) => metaById.get(fid))
				.filter((m): m is NonNullable<typeof m> => m != null);

			// Sort by uploaded_at descending — newest first
			chainMeta.sort(
				(a, b) => new Date(b.uploaded_at ?? 0).getTime() - new Date(a.uploaded_at ?? 0).getTime()
			);

			// Set file info to the newest version
			fileInfo = chainMeta[0] as FileInfo;

			// Build ledger display entries
			ledgerEntries = chainMeta.map((v, idx) => {
				const ledger = ledgerByFileId.get(v.file_id);
				return {
					block_id: ledger?.block_id ?? '',
					file_id: v.file_id,
					file_name: v.file_name,
					created_at: ledger?.created_at ?? v.uploaded_at ?? '',
					signature: ledger?.signature ?? '',
					sequence: ledger?.sequence ?? chainMeta.length - idx,
					previous_block: ledger?.previous_block ?? null
				};
			});
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load revision data';
		} finally {
			loading = false;
		}
	}

	function formatDate(dateString: string | null): string {
		if (!dateString) return '—';
		return new Date(dateString).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function formatSize(bytes: number): string {
		if (bytes === 0) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function truncateHash(hash: string | null): string {
		if (!hash) return '—';
		if (hash.length <= 16) return hash;
		return `${hash.slice(0, 8)}…${hash.slice(-8)}`;
	}
</script>

<Drawer.Root bind:open direction="bottom">
	<Drawer.Content>
		<div class="mx-auto w-full max-w-4xl">
			<Drawer.Header class="flex flex-row items-center justify-between">
				<div class="flex items-center gap-2">
					<FileStack class="size-5 text-primary" />
					<div>
						<Drawer.Title>Revision History</Drawer.Title>
						<Drawer.Description class="text-xs">
							{fileName}
						</Drawer.Description>
					</div>
				</div>
				<div class="flex items-center gap-1">
					<Button
						variant="outline"
						size="sm"
						class="gap-1.5"
						onclick={() => (uploadDialogOpen = true)}
					>
						<Upload class="size-3.5" />
						Upload New Version
					</Button>
					<Button variant="ghost" size="icon" class="size-8" onclick={() => (open = false)}>
						<X class="size-4" />
					</Button>
				</div>
			</Drawer.Header>

			<div class="px-4 pb-6">
				{#if loading}
					<div class="flex items-center justify-center gap-2 py-12 text-muted-foreground">
						<Loader2 class="size-5 animate-spin" />
						<span class="text-sm">Loading revision history…</span>
					</div>
				{:else if error}
					<div class="flex items-center justify-center gap-2 py-12 text-destructive">
						<AlertCircle class="size-5" />
						<span class="text-sm">{error}</span>
					</div>
				{:else}
					<!-- File info card -->
					{#if fileInfo}
						<div class="mb-4 rounded-lg border bg-muted/30 p-4">
							<h4 class="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
								File Information
							</h4>
							<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
								<div class="flex items-start gap-2">
									<FileLock class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p class="text-[10px] text-muted-foreground">File Name</p>
										<p class="truncate text-sm font-medium" title={fileInfo.file_name}>
											{fileInfo.file_name}
										</p>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<Clock class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p class="text-[10px] text-muted-foreground">Uploaded</p>
										<p class="text-sm font-medium">{formatDate(fileInfo.uploaded_at)}</p>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<HardDrive class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p class="text-[10px] text-muted-foreground">Size</p>
										<p class="text-sm font-medium">{formatSize(fileInfo.size)}</p>
									</div>
								</div>
								<div class="flex items-start gap-2">
									<Hash class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
									<div>
										<p class="text-[10px] text-muted-foreground">File Hash</p>
										<p class="font-mono text-sm font-medium" title={fileInfo.file_hash ?? ''}>
											{truncateHash(fileInfo.file_hash)}
										</p>
									</div>
								</div>
							</div>
						</div>
					{/if}

					<!-- Ledger entries -->
					<div>
						<div class="mb-3 flex items-center justify-between">
							<h4 class="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
								Ledger Entries
							</h4>
							{#if ledgerEntries.length > 0}
								<Badge variant="secondary" class="text-xs">
									{ledgerEntries.length} revision{ledgerEntries.length !== 1 ? 's' : ''}
								</Badge>
							{/if}
						</div>

						{#if ledgerEntries.length === 0}
							<div
								class="flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center"
							>
								<FileStack class="size-8 text-muted-foreground/40" />
								<p class="mt-2 text-sm text-muted-foreground">No ledger entries yet.</p>
								<!-- <p class="mt-1 text-xs text-muted-foreground">
									Revisions will appear here once the file is recorded on the ledger.
								</p> -->
								<p class="mt-1 text-xs text-muted-foreground">Revisions here</p>
							</div>
						{:else}
							<div class="flex gap-3 overflow-x-auto pb-2">
								{#each ledgerEntries as entry (entry.file_id)}
									<div
										class="flex min-w-55 flex-col gap-2 rounded-lg border bg-card p-3 shadow-sm transition-colors hover:bg-muted/40"
									>
										<!-- Version badge + timestamp -->
										<div class="flex items-center justify-between gap-2">
											<Badge variant="outline" class="gap-1 px-1.5 text-[10px] font-semibold">
												v{entry.sequence}
											</Badge>
											<span class="text-[10px] text-muted-foreground">
												{formatDate(entry.created_at)}
											</span>
										</div>

										<Separator />

										<!-- File icon + name -->
										<div class="flex items-center gap-2">
											<FileLock class="size-4 shrink-0 text-muted-foreground" />
											<span class="truncate text-xs font-medium" title={entry.file_name}>
												{entry.file_name}
											</span>
										</div>

										<!-- Signature hash -->
										<div class="flex items-center gap-1.5">
											<Hash class="size-3 shrink-0 text-muted-foreground" />
											<span
												class="truncate font-mono text-[10px] text-muted-foreground"
												title={entry.signature}
											>
												{truncateHash(entry.signature)}
											</span>
										</div>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</Drawer.Content>
</Drawer.Root>

<UploadNewVersion
	bind:open={uploadDialogOpen}
	{fileName}
	{folderPath}
	onUploaded={() => {
		loadRevisionData();
		onVersionUploaded?.();
	}}
/>
