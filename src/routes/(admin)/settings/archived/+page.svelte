<script lang="ts">
	import type { PageData } from './$types';
	import * as Table from '$lib/shadcn/components/ui/table/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import { deserialize } from '$app/forms';
	import { invalidate } from '$app/navigation';
	import { RotateCcw, Users, FolderOpen, FileText } from '@lucide/svelte';
	import RestoreConfirmDialog from '$lib/components/admin/RestoreConfirmDialog.svelte';

	import { page } from '$app/state';
	import { hasPermission } from '$lib/services/permissions';

	let { data }: { data: PageData } = $props();

	const permissions = $derived((page.data.permissions as string[]) ?? []);
	const canArchiveClients = $derived(hasPermission(permissions, 'clients.archive'));
	const canArchiveApps = $derived(hasPermission(permissions, 'applications.archive'));
	const canArchiveFiles = $derived(hasPermission(permissions, 'files.archive'));

	let restoreOpen = $state(false);
	let restoreTarget = $state<{ id: string; name: string; type: string; action: string } | null>(
		null
	);
	let submitting = $state(false);
	let errorMessage = $state<string | null>(null);

	function daysRemaining(archivedAt: string): number {
		const archived = new Date(archivedAt);
		const deleteDate = new Date(archived.getTime() + 30 * 24 * 60 * 60 * 1000);
		const now = new Date();
		return Math.max(0, Math.ceil((deleteDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
	}

	function openRestore(id: string, name: string, type: string, action: string): void {
		restoreTarget = { id, name, type, action };
		restoreOpen = true;
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Archived Items</h1>
		<p class="text-sm text-muted-foreground">
			Archived items are permanently deleted after 30 days. You can restore them before deletion.
		</p>
	</div>

	{#if canArchiveClients}
		<!-- Archived Clients -->
		<section class="space-y-3">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<Users class="size-5" />
				Archived Clients
				{#if data.archivedClients.length > 0}
					<Badge variant="secondary">{data.archivedClients.length}</Badge>
				{/if}
			</h2>

			{#if data.archivedClients.length === 0}
				<p class="py-4 text-center text-sm text-muted-foreground">No archived clients.</p>
			{:else}
				<div class="rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Name</Table.Head>
								<Table.Head>Email</Table.Head>
								<Table.Head>Archived On</Table.Head>
								<Table.Head>Days Left</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.archivedClients as client (client.client_id)}
								{@const name = client.is_individual
									? [client.first_name, client.last_name].filter(Boolean).join(' ')
									: (client.company_name ?? 'Unknown')}
								<Table.Row>
									<Table.Cell class="font-medium">{name}</Table.Cell>
									<Table.Cell>{client.email ?? '—'}</Table.Cell>
									<Table.Cell>{formatDate(client.archived_at)}</Table.Cell>
									<Table.Cell>
										{@const days = daysRemaining(client.archived_at)}
										<Badge variant={days <= 7 ? 'destructive' : 'secondary'}
											>{days} day{days !== 1 ? 's' : ''}</Badge
										>
									</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="outline"
											size="sm"
											onclick={() =>
												openRestore(client.client_id, name, 'Client', '?/restoreClient')}
										>
											<RotateCcw class="size-3.5" />
											Restore
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</section>
	{/if}

	{#if canArchiveApps}
		<!-- Archived Applications -->
		<section class="space-y-3">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<FolderOpen class="size-5" />
				Archived Applications
				{#if data.archivedApplications.length > 0}
					<Badge variant="secondary">{data.archivedApplications.length}</Badge>
				{/if}
			</h2>

			{#if data.archivedApplications.length === 0}
				<p class="py-4 text-center text-sm text-muted-foreground">No archived applications.</p>
			{:else}
				<div class="rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Application #</Table.Head>
								<Table.Head>Title</Table.Head>
								<Table.Head>Status</Table.Head>
								<Table.Head>Archived On</Table.Head>
								<Table.Head>Days Left</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.archivedApplications as app (app.application_id)}
								<Table.Row>
									<Table.Cell>{app.application_number ?? 'N/A'}</Table.Cell>
									<Table.Cell class="max-w-xs truncate font-medium"
										>{app.title_of_invention}</Table.Cell
									>
									<Table.Cell>{app.status}</Table.Cell>
									<Table.Cell>{formatDate(app.archived_at)}</Table.Cell>
									<Table.Cell>
										{@const days = daysRemaining(app.archived_at)}
										<Badge variant={days <= 7 ? 'destructive' : 'secondary'}
											>{days} day{days !== 1 ? 's' : ''}</Badge
										>
									</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="outline"
											size="sm"
											onclick={() =>
												openRestore(
													app.application_id,
													app.title_of_invention,
													'Application',
													'?/restoreApplication'
												)}
										>
											<RotateCcw class="size-3.5" />
											Restore
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</section>
	{/if}

	{#if canArchiveFiles}
		<!-- Archived Files -->
		<section class="space-y-3">
			<h2 class="flex items-center gap-2 text-lg font-semibold">
				<FileText class="size-5" />
				Archived Files
				{#if data.archivedFiles.length > 0}
					<Badge variant="secondary">{data.archivedFiles.length}</Badge>
				{/if}
			</h2>

			{#if data.archivedFiles.length === 0}
				<p class="py-4 text-center text-sm text-muted-foreground">No archived files.</p>
			{:else}
				<div class="rounded-lg border">
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>File Name</Table.Head>
								<Table.Head>Category</Table.Head>
								<Table.Head>Archived On</Table.Head>
								<Table.Head>Days Left</Table.Head>
								<Table.Head class="text-right">Actions</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each data.archivedFiles as file (file.file_id)}
								<Table.Row>
									<Table.Cell class="max-w-xs truncate font-medium">{file.file_name}</Table.Cell>
									<Table.Cell>{file.category ?? '—'}</Table.Cell>
									<Table.Cell>{formatDate(file.archived_at)}</Table.Cell>
									<Table.Cell>
										{@const days = daysRemaining(file.archived_at)}
										<Badge variant={days <= 7 ? 'destructive' : 'secondary'}
											>{days} day{days !== 1 ? 's' : ''}</Badge
										>
									</Table.Cell>
									<Table.Cell class="text-right">
										<Button
											variant="outline"
											size="sm"
											onclick={() =>
												openRestore(file.file_id, file.file_name, 'File', '?/restoreFile')}
										>
											<RotateCcw class="size-3.5" />
											Restore
										</Button>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</section>
	{/if}
</div>

{#if restoreTarget}
	<RestoreConfirmDialog
		bind:open={restoreOpen}
		itemName={restoreTarget.name}
		itemType={restoreTarget.type}
		{submitting}
		{errorMessage}
		onconfirm={() => {
			if (!restoreTarget) return;
			submitting = true;
			errorMessage = null;

			const form = document.createElement('form');
			form.method = 'POST';
			form.action = restoreTarget.action;
			form.style.display = 'none';

			const idField = document.createElement('input');
			idField.type = 'hidden';
			idField.name =
				restoreTarget.type === 'Client'
					? 'client_id'
					: restoreTarget.type === 'Application'
						? 'application_id'
						: 'file_id';
			idField.value = restoreTarget.id;
			form.appendChild(idField);

			document.body.appendChild(form);

			// ponytail: use native deserialize from $app/forms to parse SvelteKit action results
			const formData = new FormData(form);
			fetch(restoreTarget.action, { method: 'POST', body: formData })
				.then(async (res) => {
					const text = await res.text();
					const result = deserialize(text);

					if (result.type === 'success') {
						restoreOpen = false;
						restoreTarget = null;
						invalidate('db:archived-items');
					} else if (result.type === 'failure') {
						errorMessage =
							typeof result.data?.error === 'string'
								? result.data.error
								: 'Failed to restore item.';
					} else if (result.type === 'error') {
						errorMessage = result.error?.message ?? 'An unexpected error occurred.';
					} else {
						errorMessage = 'Failed to restore item.';
					}
				})
				.catch(() => {
					errorMessage = 'Network error.';
				})
				.finally(() => {
					submitting = false;
					document.body.removeChild(form);
				});
		}}
		oncancel={() => {
			restoreOpen = false;
			restoreTarget = null;
			errorMessage = null;
		}}
	/>
{/if}
