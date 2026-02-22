<script lang="ts">
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import { Separator } from '$lib/shadcn/components/ui/separator/index.js';
	import {
		ChevronDown,
		ChevronRight,
		FolderClosed,
		FolderOpen,
		Loader2,
		FileJson,
		FileLock,
		File
	} from '@lucide/svelte';

	let {
		sheetOpen = $bindable(false),
		filesLoading,
		filesError,
		selectedApp,
		getStatusStyle,
		getClientName,
		formatDate,
		files
	} = $props();
	let folderExpanded = $state(true);

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

	function formatCurrency(amount: number | null): string {
		if (amount == null) return '—';
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
	}
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="right" class="overflow-y-auto sm:max-w-xl">
		<Sheet.Header>
			<Sheet.Title class="text-lg">Application Details</Sheet.Title>
			<Sheet.Description>
				{#if selectedApp}
					{selectedApp.application_number}
				{/if}
			</Sheet.Description>
		</Sheet.Header>

		{#if selectedApp}
			{@const app = selectedApp}
			<div class="flex flex-col gap-6 px-4 pb-8">
				<!-- Status badge -->
				{#if app.status}
					{@const style = getStatusStyle(app.status)}
					<div>
						<Badge variant="outline" class="gap-1.5 font-normal {style.badge}">
							<span class="size-1.5 rounded-full {style.dot}"></span>
							{app.status}
						</Badge>
					</div>
				{/if}

				<!-- Invention Info -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Invention
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Title of Invention</dt>
							<dd class="font-medium">{app.title_of_invention}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Type of Invention</dt>
							<dd class="font-medium">{app.type_of_invention_name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Pre-Protection Status</dt>
							<dd class="font-medium">{app.pre_protection_status_name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Office Action</dt>
							<dd class="font-medium">{app.type_of_office_action_name ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Inventor(s)</dt>
							<dd class="font-medium">
								{#if app.inventor_names && app.inventor_names.length > 0}
									{app.inventor_names.join(', ')}
								{:else}
									—
								{/if}
							</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<!-- Client Info -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Client
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Name</dt>
							<dd class="font-medium">{getClientName(app)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium">{app.client_email ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Contact Details</dt>
							<dd class="font-medium">{app.contact_details ?? '—'}</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<!-- Dates & Fees -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Dates &amp; Fees
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Filing Date</dt>
							<dd class="font-medium">{formatDate(app.filling_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Deadline</dt>
							<dd class="font-medium">{formatDate(app.deadline)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Mailing Date</dt>
							<dd class="font-medium">{formatDate(app.mailing_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Publication Date</dt>
							<dd class="font-medium">{formatDate(app.publication_date)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Paper Doc. No.</dt>
							<dd class="font-mono font-medium">{app.paper_document_no ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Fees</dt>
							<dd class="font-medium">{formatCurrency(app.fees)}</dd>
						</div>
					</dl>
				</section>

				{#if app.remarks}
					<Separator />
					<section>
						<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
							Remarks
						</h3>
						<p class="text-sm leading-relaxed">{app.remarks}</p>
					</section>
				{/if}

				<Separator />

				<!-- File Explorer -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Files
					</h3>

					{#if !app.link_to_folder}
						<p class="text-sm text-muted-foreground">No folder linked to this application.</p>
					{:else if filesLoading}
						<div class="flex items-center gap-2 text-sm text-muted-foreground">
							<Loader2 class="size-4 animate-spin" />
							Loading files…
						</div>
					{:else if filesError}
						<p class="text-sm text-destructive">{filesError}</p>
					{:else}
						<!-- Solution Explorer style tree -->
						<div class="rounded-md border bg-muted/30 font-mono text-sm">
							<!-- Folder root -->
							<button
								class="flex w-full items-center gap-1.5 px-3 py-2 text-left transition-colors hover:bg-muted/60"
								onclick={() => (folderExpanded = !folderExpanded)}
							>
								{#if folderExpanded}
									<ChevronDown class="size-3.5 shrink-0 text-muted-foreground" />
									<FolderOpen class="size-4 shrink-0 text-amber-500" />
								{:else}
									<ChevronRight class="size-3.5 shrink-0 text-muted-foreground" />
									<FolderClosed class="size-4 shrink-0 text-amber-500" />
								{/if}
								<span class="truncate font-semibold">{app.link_to_folder}</span>
								<span class="ml-auto shrink-0 text-xs text-muted-foreground">
									{files.length} item{files.length !== 1 ? 's' : ''}
								</span>
							</button>

							{#if folderExpanded}
								{#if files.length === 0}
									<div class="px-3 py-2 pl-10 text-muted-foreground italic">No files found</div>
								{:else}
									{#each files as file (file.name)}
										{@const Icon = getFileIcon(file.name)}
										<div
											class="group flex items-center gap-1.5 border-t border-border/50 px-3 py-1.5 pl-10 transition-colors hover:bg-muted/60"
										>
											<Icon
												class="size-4 shrink-0 {file.isMeta
													? 'text-sky-500'
													: 'text-muted-foreground'}"
											/>
											<span class="truncate">{file.name}</span>
											<span class="ml-auto shrink-0 text-xs text-muted-foreground">
												{formatFileSize(file.size)}
											</span>
										</div>
									{/each}
								{/if}
							{/if}
						</div>
					{/if}
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
