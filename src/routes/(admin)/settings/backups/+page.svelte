<script lang="ts">
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';
	import { toast } from 'svelte-sonner';
	import { Database, Play, RotateCcw, ShieldCheck, FileText, AlertTriangle } from '@lucide/svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import * as Card from '$lib/shadcn/components/ui/card/index.js';

	import { invalidateAll } from '$app/navigation';

	let { data }: PageProps = $props();

	// Reactive state variables using Svelte 5 runes
	let isBackingUp = $state(false);
	let isRestoring = $state(false);
	let selectedBackupForRestore = $state('');
	let showConfirmModal = $state(false);

	// Auto-polling: true when any log is pending or running
	const hasActiveJob = $derived(
		data.logs?.some((log) => log.status === 'pending' || log.status === 'running') ?? false
	);

	// Poll every 5 minutes while a job is active, stop when resolved
	$effect(() => {
		if (!hasActiveJob) return;

		const interval = setInterval(() => {
			invalidateAll();
		}, 5 * 60 * 1000);

		return () => clearInterval(interval);
	});

	// Sizing helper
	const formatBytes = (bytes: number | null): string => {
		if (bytes === null || bytes === undefined) return 'N/A';
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	};

	// Date formatter helper
	const formatDate = (isoStr: string | null): string => {
		if (!isoStr) return 'N/A';
		return new Date(isoStr).toLocaleString();
	};
</script>

<div class="mx-auto flex max-w-6xl flex-col gap-6 p-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Backup & Recovery Center</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Monitor backup health, run manual database and storage snapshots, or recover files and tables
			to a prior state.
		</p>
	</div>

	<!-- Status Banner -->
	{#if data.logs && data.logs.length > 0}
		{@const lastLog = data.logs[0]}
		<div
			class="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm transition-all duration-300
			{lastLog.status === 'completed'
				? 'border-emerald-300 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400'
				: 'border-destructive/30 bg-destructive/5 text-destructive dark:border-destructive/50 dark:bg-destructive/10'}"
		>
			{#if lastLog.status === 'completed'}
				<ShieldCheck class="mt-0.5 h-5 w-5 shrink-0" />
			{:else}
				<AlertTriangle class="mt-0.5 h-5 w-5 shrink-0" />
			{/if}
			<div>
				<h4 class="font-semibold">
					System Backup Status: {lastLog.status.toUpperCase()}
				</h4>
				<p class="mt-1">
					Last backup executed: <span class="font-medium">{formatDate(lastLog.created_at)}</span>
					({lastLog.backup_type} run).
				</p>
				{#if lastLog.error_message}
					<p
						class="mt-2 rounded bg-destructive/15 p-2 font-mono text-xs text-destructive dark:bg-destructive/20"
					>
						Error details: {lastLog.error_message}
					</p>
				{/if}
			</div>
		</div>
	{/if}

	<!-- Controls Grid -->
	<div class="grid grid-cols-1 gap-6 md:grid-cols-2">
		<!-- Manual Backup Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Trigger Manual Backup</Card.Title>
				<Card.Description>
					Create an immediate database snapshot and sync all objects to Cloudflare R2 bucket
					storage.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<form
					method="POST"
					action="?/triggerBackup"
					use:enhance={() => {
						isBackingUp = true;
						return async ({ result, update }) => {
							isBackingUp = false;
							if (result.type === 'success') {
								toast.success('Backup execution initiated successfully.');
							} else if (result.type === 'failure') {
								const data = result.data as { message?: string };
								toast.error(data?.message || 'Failed to initiate backup execution.');
							} else {
								toast.error('An unexpected response occurred.');
							}
							await update({ reset: false });
						};
					}}
				>
					<Button
						type="submit"
						disabled={isBackingUp}
						class="flex w-full items-center justify-center gap-2"
					>
						<Play class="h-4 w-4" />
						{isBackingUp ? 'Initiating Backup...' : 'Run Backup Now'}
					</Button>
				</form>
			</Card.Content>
		</Card.Root>

		<!-- System Recovery Card -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Execute Disaster Recovery</Card.Title>
				<Card.Description>
					Revert the live database schemas, user permissions, and storage files to a completed
					backup set.
				</Card.Description>
			</Card.Header>
			<Card.Content class="flex flex-col gap-4">
				<div class="flex flex-col gap-2">
					<label for="backup-select" class="text-sm font-medium">Select Target Snapshot</label>
					<select
						id="backup-select"
						bind:value={selectedBackupForRestore}
						class="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						<option value="" disabled>-- Select a completed backup --</option>
						{#if data.logs}
							{#each data.logs.filter((log) => log.status === 'completed' && log.db_file_name) as log (log.id)}
								{@const folderDate = log.db_file_name ? log.db_file_name.split('/')[0] : ''}
								<option value={folderDate}>
									{formatDate(log.created_at)} (DB: {formatBytes(log.db_file_size)} | Storage: {formatBytes(
										log.storage_size
									)})
								</option>
							{/each}
						{/if}
					</select>
				</div>

				<Button
					variant="destructive"
					disabled={!selectedBackupForRestore || isRestoring}
					onclick={() => (showConfirmModal = true)}
					class="flex items-center justify-center gap-2"
				>
					<RotateCcw class="h-4 w-4" />
					Recover System State
				</Button>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- History Table -->
	<Card.Root>
		<Card.Header>
			<Card.Title>Backup Log History</Card.Title>
			<Card.Description>
				Showing execution history of the last 50 backup operations performed on the platform.
			</Card.Description>
		</Card.Header>
		<Card.Content class="overflow-x-auto p-0">
			<table class="w-full border-collapse text-left text-sm">
				<thead>
					<tr class="border-b bg-muted/30 font-medium text-muted-foreground">
						<th class="px-6 py-3">Trigger Time</th>
						<th class="px-6 py-3">Execution Type</th>
						<th class="px-6 py-3">Status</th>
						<th class="px-6 py-3">Database Size</th>
						<th class="px-6 py-3">Storage Volume</th>
						<th class="px-6 py-3">Duration</th>
					</tr>
				</thead>
				<tbody>
					{#if data.logs && data.logs.length > 0}
						{#each data.logs as log (log.id)}
							<tr class="border-b transition-colors hover:bg-muted/30">
								<td class="px-6 py-4 font-mono text-xs">{formatDate(log.created_at)}</td>
								<td class="px-6 py-4 capitalize">
									<span class="inline-flex items-center gap-1.5">
										{#if log.backup_type === 'manual'}
											<Badge variant="outline">Manual</Badge>
										{:else}
											<Badge variant="secondary">Scheduled</Badge>
										{/if}
									</span>
								</td>
								<td class="px-6 py-4">
									<Badge
										variant={log.status === 'completed'
											? 'default'
											: log.status === 'failed'
												? 'destructive'
												: 'secondary'}
									>
										{log.status}
									</Badge>
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex items-center gap-1 text-muted-foreground">
										<Database class="h-3.5 w-3.5" />
										{formatBytes(log.db_file_size)}
									</span>
								</td>
								<td class="px-6 py-4">
									<span class="inline-flex items-center gap-1 text-muted-foreground">
										<FileText class="h-3.5 w-3.5" />
										{formatBytes(log.storage_size)}
									</span>
								</td>
								<td class="px-6 py-4 text-muted-foreground">
									{log.duration_seconds ? `${log.duration_seconds}s` : 'N/A'}
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="6" class="py-8 text-center text-muted-foreground">
								No execution logs found in system database.
							</td>
						</tr>
					{/if}
				</tbody>
			</table>
		</Card.Content>
	</Card.Root>
</div>

<!-- Reversion Modal Dialog -->
{#if showConfirmModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
		<div
			class="w-full max-w-md animate-in rounded-lg border border-destructive/30 bg-background p-6 shadow-2xl duration-150 zoom-in-95 fade-in"
		>
			<h3 class="flex items-center gap-2 text-lg font-bold text-destructive">
				<AlertTriangle class="h-5 w-5" />
				CRITICAL: OVERWRITE SYSTEM STATE
			</h3>
			<p class="mt-3 text-sm leading-relaxed text-muted-foreground">
				You are about to execute a recovery restore. This will overwrite active database tables and
				revert all storage files in the Supabase bucket to the backup from:
			</p>
			<div class="mt-2 rounded border bg-muted p-3 text-center font-mono text-sm font-semibold">
				{selectedBackupForRestore}
			</div>
			<p class="mt-3 text-xs font-semibold text-red-500">
				WARNING: This operation is destructive and irreversible. All changes made since this backup
				point will be permanently lost.
			</p>

			<div class="mt-6 flex justify-end gap-3">
				<Button variant="outline" onclick={() => (showConfirmModal = false)}>Cancel</Button>

				<form
					method="POST"
					action="?/triggerRecovery"
					use:enhance={() => {
						isRestoring = true;
						showConfirmModal = false;
						return async ({ result, update }) => {
							isRestoring = false;
							if (result.type === 'success') {
								toast.success('System recovery workflow initiated. Processing...');
							} else if (result.type === 'failure') {
								const data = result.data as { message?: string };
								toast.error(data?.message || 'Failed to trigger system recovery.');
							} else {
								toast.error('An unexpected response occurred.');
							}
							await update({ reset: false });
						};
					}}
				>
					<input type="hidden" name="backupFolder" value={selectedBackupForRestore} />
					<Button variant="destructive" type="submit" disabled={isRestoring}>
						{isRestoring ? 'Triggering Recovery...' : 'Confirm Restore'}
					</Button>
				</form>
			</div>
		</div>
	</div>
{/if}
