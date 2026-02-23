<script lang="ts">
	import * as Drawer from '$lib/shadcn/components/ui/drawer/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Separator } from '$lib/shadcn/components/ui/separator/index.js';
	import {
		FileStack,
		FileLock,
		Clock,
		Hash,
		HardDrive,
		Loader2,
		AlertCircle,
		X
	} from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';

	interface LedgerEntry {
		block_id: string;
		file_id: string;
		created_at: string;
		signature: string;
		sequence: number;
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
		folderPath
	}: {
		open: boolean;
		fileName: string;
		folderPath: string;
	} = $props();

	let loading = $state(false);
	let error = $state<string | null>(null);
	let fileInfo = $state<FileInfo | null>(null);
	let ledgerEntries = $state<LedgerEntry[]>([]);

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

			// Build the full file path for lookup
			const fullPath = `${folderPath}/${fileName}`;

			// Fetch file_metadata record for this file
			const { data: metaData, error: metaError } = await supabase
				.schema('api')
				.from('file_metadata')
				.select('file_id, file_name, file_hash, file_path, uploaded_at, size, status')
				.eq('file_path', fullPath)
				.maybeSingle();

			if (metaError) throw new Error(metaError.message);

			if (metaData) {
				fileInfo = metaData as FileInfo;

				// Fetch ledger entries for this file
				const { data: ledgerData, error: ledgerError } = await supabase
					.schema('api')
					.from('file_ledger')
					.select('block_id, file_id, created_at, signature, sequence')
					.eq('file_id', metaData.file_id)
					.order('sequence', { ascending: false });

				if (ledgerError) throw new Error(ledgerError.message);
				ledgerEntries = (ledgerData ?? []) as LedgerEntry[];
			} else {
				// No metadata record found — show basic info from storage
				fileInfo = {
					file_id: null,
					file_name: fileName,
					file_hash: null,
					file_path: fullPath,
					uploaded_at: null,
					size: 0,
					status: null
				};
			}
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
				<Button variant="ghost" size="icon" class="size-8" onclick={() => (open = false)}>
					<X class="size-4" />
				</Button>
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
								{#each ledgerEntries as entry (entry.block_id)}
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
											<span class="truncate text-xs font-medium" title={fileName}>
												{fileName}
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
