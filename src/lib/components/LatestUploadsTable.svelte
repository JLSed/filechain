<script lang="ts">
	import * as Table from '$lib/components/shadcn/ui/table/index.js';
	import type { FileMetadata } from '$lib/types/file';
	import { formatDate } from '$lib/utils/format';
	import { Hash, Calendar, User, Lock } from 'lucide-svelte';

	interface Props {
		files: FileMetadata[];
		profile?: { first_name: string; middle_name?: string; last_name: string; role: string } | null;
	}

	let { files, profile = null }: Props = $props();

	/**
	 * Truncates a hash string for display
	 */
	function truncateHash(hash: string): string {
		if (hash.length <= 16) return hash;
		return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
	}

	/**
	 * Gets the owner display name
	 */
	function getOwnerName(): string {
		if (!profile) return 'Unknown';
		return `${profile.first_name.charAt(0).toUpperCase()}. ${profile.middle_name ? profile.middle_name.charAt(0).toUpperCase() + '. ' : ''} ${profile.last_name}`;
	}

	/**
	 * Formats timestamp for display
	 */
	function formatTimestamp(dateString: string): string {
		const date = new Date(dateString);
		return date.toLocaleString('en-US', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit'
		});
	}
</script>

<div class="space-y-4">
	<div class="flex items-center gap-2">
		<h2 class="text-xl font-semibold text-foreground">Latest Uploads</h2>
	</div>

	{#if files.length === 0}
		<div class="rounded-lg border border-border bg-background p-8 text-center">
			<div class="flex flex-col items-center gap-3">
				<Hash size={32} class="text-muted-foreground" />
				<p class="text-sm text-muted-foreground">No files uploaded yet</p>
			</div>
		</div>
	{:else}
		<div class="rounded-lg border border-border bg-background">
			<Table.Root>
				<Table.Header>
					<Table.Row class="hover:bg-transparent">
						<Table.Head class="w-[40%] text-xs font-medium text-muted-foreground uppercase">
							<div class="flex items-center gap-2">
								<Lock size={14} />
								Filename
							</div>
						</Table.Head>
						<Table.Head class="w-[25%] text-xs font-medium text-muted-foreground uppercase">
							<div class="flex items-center gap-2">
								<Hash size={14} />
								Hash (SHA-256)
							</div>
						</Table.Head>
						<Table.Head class="w-[20%] text-xs font-medium text-muted-foreground uppercase">
							<div class="flex items-center gap-2">
								<Calendar size={14} />
								Timestamp
							</div>
						</Table.Head>
						<Table.Head class="w-[15%] text-xs font-medium text-muted-foreground uppercase">
							<div class="flex items-center gap-2">
								<User size={14} />
								Uploader
							</div>
						</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each files as file (file.file_id)}
						<Table.Row class="hover:bg-muted/50">
							<Table.Cell class="py-3">
								<div class="flex items-center gap-3">
									<div class="flex h-8 w-8 items-center justify-center rounded bg-primary/10">
										<Lock size={14} class="text-primary" />
									</div>
									<span class="truncate font-medium text-foreground">
										{file.file_name}
									</span>
								</div>
							</Table.Cell>
							<Table.Cell class="py-3">
								<span
									class="cursor-pointer font-mono text-sm text-blue-600 hover:text-blue-800"
									title={file.file_hash}
								>
									{truncateHash(file.file_hash)}
								</span>
							</Table.Cell>
							<Table.Cell class="py-3">
								<span class="text-sm text-muted-foreground">
									{formatTimestamp(file.uploaded_at)}
								</span>
							</Table.Cell>
							<Table.Cell class="py-3">
								<span class="text-sm text-foreground">
									{getOwnerName()}
								</span>
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</div>
	{/if}

	{#if files.length > 0}
		<div class="flex items-center justify-between text-sm text-muted-foreground">
			<span>Showing 1-{files.length} of {files.length} records</span>
			<div class="flex items-center gap-2">
				<button
					class="rounded border border-border bg-background px-3 py-1 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
					disabled
				>
					Previous
				</button>
				<button
					class="rounded border border-border bg-background px-3 py-1 transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
					disabled
				>
					Next
				</button>
			</div>
		</div>
	{/if}
</div>
