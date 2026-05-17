<script lang="ts">
	import { untrack } from 'svelte';
	import type { FileMetadata } from '$lib/types/DatabaseTypes';
	import * as Dialog from '$lib/shadcn/components/ui/dialog/index';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import {
		ShieldCheck,
		ShieldX,
		File,
		CircleCheck,
		CircleX,
		Loader2,
		Circle,
		Link
	} from '@lucide/svelte';
	import { createBrowserClient } from '$lib/services/supabase/client';
	import { logAuditEvent } from '$lib/services/audit-log-client';
	import {
		createChainNodes,
		runChainIntegrityCheck,
		type ChainNode,
		type ChainNodeStatus
	} from '$lib/utils/chain-integrity';

	interface Props {
		files: FileMetadata[];
		open: boolean;
		onclose: () => void;
	}

	let { files, open = $bindable(), onclose }: Props = $props();

	let nodes = $state<ChainNode[]>([]);
	let running = $state(false);
	let overallPassed = $state<boolean | null>(null);

	const progress = $derived(() => {
		if (nodes.length === 0) return 0;
		const completed = nodes.filter((n) => n.status === 'passed' || n.status === 'failed').length;
		return Math.round((completed / nodes.length) * 100);
	});

	function reset(): void {
		nodes = [];
		running = false;
		overallPassed = null;
	}

	function handleOpenChange(isOpen: boolean): void {
		if (!isOpen) {
			reset();
			onclose();
		}
	}

	async function startVerification(): Promise<void> {
		if (files.length === 0 || running) return;

		reset();
		nodes = createChainNodes(files);
		running = true;

		try {
			const supabase = createBrowserClient();
			const result = await runChainIntegrityCheck(supabase, files, (updatedNodes) => {
				nodes = updatedNodes;
			});

			overallPassed = result.overallPassed;

			// Audit log
			const firstName = files[0]?.file_name ?? 'unknown';
			const lastName = files[files.length - 1]?.file_name ?? 'unknown';
			logAuditEvent({
				details: `[actor] verified chain integrity from "${firstName}" to "${lastName}" (${files.length} revisions) — ${result.overallPassed ? 'passed' : 'failed'}`,
				eventType: 'Verified Integrity',
				severityLevel: result.overallPassed ? 'notice' : 'warning'
			});
		} catch {
			overallPassed = false;

			logAuditEvent({
				details: `[actor] attempted to verify chain integrity — error occurred`,
				eventType: 'Verified Integrity',
				severityLevel: 'warning'
			});
		} finally {
			running = false;
		}
	}

	let prevOpen = false;
	$effect(() => {
		const isOpen = open;
		const currentFiles = files;
		if (isOpen && !prevOpen && currentFiles.length > 0) {
			untrack(() => startVerification());
		}
		prevOpen = isOpen;
	});

	function getNodeStatusIcon(
		status: ChainNodeStatus
	): typeof CircleCheck | typeof CircleX | typeof Loader2 | typeof Circle {
		switch (status) {
			case 'passed':
				return CircleCheck;
			case 'failed':
				return CircleX;
			case 'verifying':
				return Loader2;
			default:
				return Circle;
		}
	}

	function getNodeStatusColor(status: ChainNodeStatus): string {
		switch (status) {
			case 'passed':
				return 'text-emerald-500';
			case 'failed':
				return 'text-destructive';
			case 'verifying':
				return 'text-primary';
			default:
				return 'text-muted-foreground/30';
		}
	}

	function getConnectorClass(fromStatus: ChainNodeStatus, toStatus: ChainNodeStatus): string {
		if (fromStatus === 'passed' && (toStatus === 'passed' || toStatus === 'verifying')) {
			return 'bg-emerald-500';
		}
		if (fromStatus === 'failed' || toStatus === 'failed') {
			return 'bg-destructive';
		}
		if (fromStatus === 'passed') {
			return 'bg-emerald-500/40';
		}
		return 'bg-muted-foreground/20';
	}

	function getCardClass(status: ChainNodeStatus): string {
		switch (status) {
			case 'passed':
				return 'border-emerald-500/40 bg-emerald-500/5';
			case 'failed':
				return 'border-destructive/40 bg-destructive/5';
			case 'verifying':
				return 'border-primary/40 bg-primary/5 ring-2 ring-primary/20';
			default:
				return 'border-border bg-card opacity-50';
		}
	}
</script>

<Dialog.Root {open} onOpenChange={handleOpenChange}>
	<Dialog.Content class="overflow-hidden sm:max-w-lg">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				{#if overallPassed === true}
					<ShieldCheck class="size-5 text-emerald-500" />
				{:else if overallPassed === false}
					<ShieldX class="size-5 text-destructive" />
				{:else}
					<ShieldCheck class="size-5 text-primary" />
				{/if}
				Verify Chain Integrity
			</Dialog.Title>
			<Dialog.Description>
				Verifying the connection and integrity of {files.length} revision{files.length !== 1
					? 's'
					: ''} in this chain
			</Dialog.Description>
		</Dialog.Header>

		<div class="grid gap-4 py-2">
			<!-- Progress indicator -->
			<div class="flex items-center justify-between text-xs text-muted-foreground">
				<span>
					{#if running}
						Verifying…
					{:else if overallPassed === true}
						All revisions verified
					{:else if overallPassed === false}
						Chain integrity compromised
					{:else}
						Starting…
					{/if}
				</span>
				{#if running}
					<span class="text-primary">{progress()}%</span>
				{/if}
			</div>

			<!-- Chain visualization -->
			<div class="max-h-[320px] overflow-y-auto rounded-lg border bg-muted/20 p-4">
				<div class="flex flex-col items-stretch gap-0">
					{#each nodes as node, i (node.fileId)}
						{@const IconComponent = getNodeStatusIcon(node.status)}

						<!-- Node card -->
						<div
							class="flex items-center gap-3 rounded-lg border p-3 transition-all duration-300 {getCardClass(
								node.status
							)}"
						>
							<!-- Status icon -->
							<div class="shrink-0">
								<IconComponent
									class="size-5 {getNodeStatusColor(node.status)} {node.status === 'verifying'
										? 'animate-spin'
										: ''} transition-colors duration-300"
								/>
							</div>

							<!-- File info -->
							<div class="min-w-0 flex-1">
								<div class="flex items-center gap-2">
									<File class="size-3.5 shrink-0 text-muted-foreground" />
									<p class="truncate text-sm font-medium">{node.fileName}</p>
								</div>
							</div>

							<!-- Sequence badge -->
							<Badge
								variant="secondary"
								class="shrink-0 text-[10px] {node.status === 'passed'
									? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
									: node.status === 'failed'
										? 'border-destructive/20 bg-destructive/10 text-destructive'
										: ''}"
							>
								{node.isGenesis ? 'Genesis' : `v${node.sequence}`}
							</Badge>
						</div>

						<!-- Connector between nodes -->
						{#if i < nodes.length - 1}
							{@const nextNode = nodes[i + 1]}
							<div class="flex items-center justify-center py-1">
								<div class="flex flex-col items-center gap-0.5">
									<div
										class="h-3 w-0.5 rounded-full transition-colors duration-500 {getConnectorClass(
											node.status,
											nextNode.status
										)}"
									></div>
									<Link
										class="size-3 transition-colors duration-500 {node.status === 'passed' &&
										(nextNode.status === 'passed' || nextNode.status === 'verifying')
											? 'text-emerald-500'
											: node.status === 'failed' || nextNode.status === 'failed'
												? 'text-destructive'
												: 'text-muted-foreground/20'}"
									/>
									<div
										class="h-3 w-0.5 rounded-full transition-colors duration-500 {getConnectorClass(
											node.status,
											nextNode.status
										)}"
									></div>
								</div>
							</div>
						{/if}
					{/each}
				</div>
			</div>

			<!-- Final result badge -->
			{#if !running && overallPassed !== null}
				<div class="flex items-center justify-center pt-1">
					{#if overallPassed}
						<Badge
							variant="secondary"
							class="gap-1.5 border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-emerald-600"
						>
							<ShieldCheck class="size-3.5" />
							Chain integrity verified
						</Badge>
					{:else}
						<Badge
							variant="secondary"
							class="gap-1.5 border-destructive/20 bg-destructive/10 px-3 py-1.5 text-destructive"
						>
							<ShieldX class="size-3.5" />
							Chain integrity compromised
						</Badge>
					{/if}
				</div>
			{/if}
		</div>

		<Dialog.Footer>
			<Button
				type="button"
				variant={overallPassed === null ? 'outline' : 'default'}
				onclick={() => handleOpenChange(false)}
				disabled={running}
			>
				Close
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
