<script lang="ts">
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import * as ContextMenu from '$lib/shadcn/components/ui/context-menu/index.js';
	import {
		ChevronDown,
		ChevronRight,
		Eye,
		File,
		FileJson,
		FileLock,
		FileStack,
		FolderClosed,
		FolderOpen,
		Loader2,
		User
	} from '@lucide/svelte';
	import type { ClientFolder } from '../../../routes/(admin)/files/+page.server';
	import type { StorageFile } from '../../../routes/(admin)/patenting/client/files/+server';
	import type { IpApplicationStatus } from '$lib/types/filing-forms/ip-application';

	let {
		folder,
		onViewDetails,
		onViewFile,
		onViewHistory
	}: {
		folder: ClientFolder;
		onViewDetails: (app: ClientFolder['applications'][0]) => void;
		onViewFile: (fileName: string, folderPath: string) => void;
		onViewHistory: (fileName: string, folderPath: string) => void;
	} = $props();

	let expanded = $state(false);

	/** Per-application file data, keyed by application_number */
	let appFiles = $state<Record<string, StorageFile[]>>({});
	let appFilesLoading = $state<Record<string, boolean>>({});
	let appFilesError = $state<Record<string, string | null>>({});
	let appExpanded = $state<Record<string, boolean>>({});

	async function toggleAppFolder(appNumber: string, linkToFolder: string | null) {
		const wasExpanded = appExpanded[appNumber] ?? false;
		appExpanded[appNumber] = !wasExpanded;

		// Only fetch if expanding and haven't loaded yet
		if (!wasExpanded && linkToFolder && !appFiles[appNumber]) {
			appFilesLoading[appNumber] = true;
			appFilesError[appNumber] = null;

			try {
				const res = await fetch(`/patenting/client/files?path=${encodeURIComponent(linkToFolder)}`);
				if (!res.ok) throw new Error('Failed to load files');
				const json = await res.json();
				appFiles[appNumber] = json.files as StorageFile[];
			} catch (err) {
				appFilesError[appNumber] = err instanceof Error ? err.message : 'Unknown error';
			} finally {
				appFilesLoading[appNumber] = false;
			}
		}
	}

	function formatFileSize(bytes: number): string {
		if (bytes === 0) return '—';
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}

	function getFileIcon(name: string) {
		if (name.endsWith('.meta.json')) return FileJson;
		if (name.endsWith('.enc')) return FileLock;
		return File;
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

<!-- Client root folder -->
<div class="rounded-md border bg-muted/30 font-mono text-sm">
	<!-- Client folder header -->
	<button
		class="flex w-full items-center gap-2 px-3 py-2.5 text-left transition-colors hover:bg-muted/60"
		onclick={() => (expanded = !expanded)}
	>
		{#if expanded}
			<ChevronDown class="size-3.5 shrink-0 text-muted-foreground" />
		{:else}
			<ChevronRight class="size-3.5 shrink-0 text-muted-foreground" />
		{/if}

		<User class="size-3.5 shrink-0 text-muted-foreground" />
		<span class="truncate font-sans font-semibold">{folder.clientName}</span>

		{#if folder.clientEmail}
			<span class="ml-1 truncate font-sans text-xs text-muted-foreground">
				({folder.clientEmail})
			</span>
		{/if}

		<span class="ml-auto shrink-0 font-sans text-xs text-muted-foreground">
			{folder.applications.length} application{folder.applications.length !== 1 ? 's' : ''}
		</span>
	</button>

	{#if expanded}
		{#if folder.applications.length === 0}
			<div class="border-t border-border/50 px-3 py-2 pl-10 font-sans text-muted-foreground italic">
				No applications found
			</div>
		{:else}
			{#each folder.applications as app (app.application_number)}
				{@const isAppExpanded = appExpanded[app.application_number] ?? false}
				{@const loading = appFilesLoading[app.application_number] ?? false}
				{@const error = appFilesError[app.application_number] ?? null}
				{@const files = appFiles[app.application_number] ?? []}
				{@const style = getStatusStyle(app.status)}

				<!-- Application sub-folder -->
				<div class="border-t border-border/50">
					<div class="flex items-center gap-1.5 py-2 pr-3 pl-8 transition-colors hover:bg-muted/60">
						<!-- Expand/collapse toggle -->
						<button
							class="flex min-w-0 flex-1 items-center gap-1.5 text-left"
							onclick={() => toggleAppFolder(app.application_number, app.link_to_folder)}
						>
							{#if isAppExpanded}
								<ChevronDown class="size-3.5 shrink-0 text-muted-foreground" />
								<FolderOpen class="size-4 shrink-0 text-amber-500/70" />
							{:else}
								<ChevronRight class="size-3.5 shrink-0 text-muted-foreground" />
								<FolderClosed class="size-4 shrink-0 text-amber-500/70" />
							{/if}

							<span class="truncate font-sans font-medium">{app.title_of_invention}</span>
						</button>

						<!-- Status badge -->
						<Badge
							variant="outline"
							class="shrink-0 gap-1 px-1.5 py-0.5 font-sans text-[10px] {style.badge}"
						>
							<span class="size-1.5 rounded-full {style.dot}"></span>
							{app.status}
						</Badge>

						<!-- App number -->
						<span class="shrink-0 font-sans text-[10px] text-muted-foreground">
							{app.application_number}
						</span>

						<!-- View details action -->
						<Button
							variant="ghost"
							size="icon"
							class="size-7 shrink-0"
							onclick={(e: MouseEvent) => {
								e.stopPropagation();
								onViewDetails(app);
							}}
						>
							<Eye class="size-3.5" />
						</Button>
					</div>

					<!-- Files within this application -->
					{#if isAppExpanded}
						<div class="pl-14">
							{#if loading}
								<div
									class="flex items-center gap-2 border-t border-border/30 px-3 py-2 font-sans text-muted-foreground"
								>
									<Loader2 class="size-3.5 animate-spin" />
									<span class="text-xs">Loading files…</span>
								</div>
							{:else if error}
								<div class="border-t border-border/30 px-3 py-2 font-sans text-xs text-destructive">
									{error}
								</div>
							{:else}
								{@const visibleFiles = files.filter((f) => !f.isMeta)}
								{#if visibleFiles.length === 0}
									<div
										class="border-t border-border/30 px-3 py-2 font-sans text-xs text-muted-foreground italic"
									>
										No files found
									</div>
								{:else}
									{#each visibleFiles as file (file.name)}
										{@const Icon = getFileIcon(file.name)}
										<ContextMenu.Root>
											<ContextMenu.Trigger>
												<div
													class="group flex cursor-context-menu items-center gap-1.5 border-t border-border/30 px-3 py-1.5 transition-colors hover:bg-muted/60"
												>
													<Icon class="size-3.5 shrink-0 text-muted-foreground" />
													<span class="truncate text-xs">{file.name}</span>
													<span class="ml-auto shrink-0 text-[10px] text-muted-foreground">
														{formatFileSize(file.size)}
													</span>
												</div>
											</ContextMenu.Trigger>
											<ContextMenu.Content class="w-48">
												<ContextMenu.Item
													onclick={() => onViewFile(file.name, app.link_to_folder ?? '')}
												>
													<Eye class="mr-2 size-4" />
													View File
												</ContextMenu.Item>
												<ContextMenu.Item
													onclick={() => onViewHistory(file.name, app.link_to_folder ?? '')}
												>
													<FileStack class="mr-2 size-4" />
													Revision History
												</ContextMenu.Item>
											</ContextMenu.Content>
										</ContextMenu.Root>
									{/each}
								{/if}
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		{/if}
	{/if}
</div>
