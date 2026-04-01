<script lang="ts">
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import type { AuditLog } from '$lib/types/DatabaseTypes';
	import { formatTimestamp } from '$lib/utils/formatter';
	import { Maximize2, Globe, User, FileText } from '@lucide/svelte';

	interface ComponentProps {
		data: AuditLog | null;
		sheetOpen: boolean;
	}

	let { data, sheetOpen = $bindable(true) }: ComponentProps = $props();

	/**
	 * Extracts the application number from the audit log details string.
	 * The details field typically contains a string like "J. P. Sedillo Edited Application 20261203008126".
	 * Returns the application number if the log is application-related, null otherwise.
	 */
	function extractApplicationNumber(log: AuditLog): string | null {
		const applicationEvents = ['Added Application', 'Edited Application', 'Submitted Application'];
		if (!applicationEvents.includes(log.event_type)) return null;

		const match = log.details.match(/\d{10,}/);
		return match ? match[0] : null;
	}

	/**
	 * Maps severity levels to badge styling.
	 */
	function getSeverityBadge(severity: string): {
		variant: 'default' | 'secondary' | 'outline' | 'destructive';
		class: string;
		label: string;
	} {
		switch (severity) {
			case 'danger':
				return { variant: 'destructive', class: '', label: 'Danger' };
			case 'warning':
				return {
					variant: 'default',
					class: 'bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-400',
					label: 'Warning'
				};
			case 'notice':
				return {
					variant: 'default',
					class: 'bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-400',
					label: 'Notice'
				};
			default:
				return { variant: 'secondary', class: '', label: 'Neutral' };
		}
	}

	const appNumber = $derived(data ? extractApplicationNumber(data) : null);
	const severityBadge = $derived(data ? getSeverityBadge(data.severity_level) : null);
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="right" class="overflow-y-auto">
		{#if data === null}
			<div class="flex h-full items-center justify-center">
				<p class="text-muted-foreground">No log selected</p>
			</div>
		{:else}
			<Sheet.Header>
				<div class="flex items-center justify-between">
					<div class="space-y-1">
						<Sheet.Title>Log Details</Sheet.Title>
						<Sheet.Description class="text-xs">
							{formatTimestamp(data.timestamp)}
						</Sheet.Description>
					</div>
					{#if severityBadge}
						<Badge variant={severityBadge.variant} class={severityBadge.class}>
							{severityBadge.label}
						</Badge>
					{/if}
				</div>
				{#if appNumber}
					<Button
						variant="outline"
						size="sm"
						class="mt-2 w-full gap-1.5"
						href="/application/{appNumber}"
					>
						<Maximize2 class="size-3.5" />
						View Application
					</Button>
				{/if}
			</Sheet.Header>

			<div class="flex flex-col gap-6 px-4 pb-8">
				<!-- Details Section -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						<FileText class="mr-1.5 inline size-3.5" />
						Details
					</h3>
					<div class="rounded-lg border bg-muted/30 p-3">
						<p class="text-sm leading-relaxed font-medium">{data.details}</p>
					</div>
				</section>

				<!-- Changes Section (conditional) -->
				{#if data.changes && Object.keys(data.changes).length > 0}
					<Separator />
					<section>
						<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
							Changes
						</h3>
						<div class="space-y-3">
							{#each Object.entries(data.changes) as [field, change] (field)}
								<div class="rounded-lg border p-3">
									<p
										class="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
									>
										{field.replace(/_/g, ' ')}
									</p>
									<div class="grid grid-cols-[auto_1fr] items-start gap-x-3 gap-y-1.5 text-sm">
										<span
											class="inline-flex items-center rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground"
										>
											Old
										</span>
										<span class="font-mono text-sm break-all">
											{String(change.old ?? '—')}
										</span>
										<span
											class="inline-flex items-center rounded-md bg-secondary/20 px-1.5 py-0.5 text-xs font-medium text-secondary"
										>
											New
										</span>
										<span class="font-mono text-sm break-all text-secondary">
											{String(change.new ?? '—')}
										</span>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<Separator />

				<!-- Actor Information Section -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						<User class="mr-1.5 inline size-3.5" />
						Actor Information
					</h3>
					<div class="rounded-lg border bg-muted/30 p-3">
						<dl class="grid gap-y-2 text-sm">
							<div class="flex items-center justify-between">
								<dt class="text-muted-foreground">Name</dt>
								<dd class="font-medium">
									{#if data.user_profiles}
										{[data.user_profiles.first_name, data.user_profiles.last_name]
											.filter(Boolean)
											.join(' ') || '—'}
									{:else}
										<span class="text-muted-foreground italic">System</span>
									{/if}
								</dd>
							</div>
							<div class="flex items-center justify-between">
								<dt class="text-muted-foreground">Role</dt>
								<dd>
									{#if data.user_profiles?.role}
										<Badge variant="outline" class="text-xs">{data.user_profiles.role}</Badge>
									{:else}
										<span class="text-muted-foreground">—</span>
									{/if}
								</dd>
							</div>
							{#if data.ip_address}
								<div class="flex items-center justify-between">
									<dt class="text-muted-foreground">
										<Globe class="mr-1 inline size-3" />
										IP Address
									</dt>
									<dd class="font-mono text-xs">{data.ip_address}</dd>
								</div>
							{/if}
						</dl>
					</div>
				</section>

				<!-- Event Metadata -->
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Event
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Event Type</dt>
							<dd>
								<Badge variant="outline" class="text-xs">{data.event_type}</Badge>
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Log ID</dt>
							<dd class="font-mono text-xs break-all text-muted-foreground">
								{data.log_id}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
