<script lang="ts">
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
	import { Maximize2 } from '@lucide/svelte';
	interface ComponentProps {
		data: IpApplication | null;
		sheetOpen: boolean;
	}

	let { data, sheetOpen = $bindable(true) }: ComponentProps = $props();
</script>

<Sheet.Root bind:open={sheetOpen}>
	<Sheet.Content side="right">
		{#if data === null}
			<div class="flex h-full items-center justify-center">
				<p>No Data</p>
			</div>
		{:else}
			<Sheet.Header>
				<div class="flex items-center justify-between">
					<div>
						<Sheet.Title>Application Details</Sheet.Title>
						<Sheet.Description>{data.status}</Sheet.Description>
						<Sheet.Description>{data.application_number ?? 'No app number'}</Sheet.Description>
					</div>
					<Button
						variant="outline"
						size="sm"
						class="gap-1.5"
						href="/application/{data.application_id}"
					>
						<Maximize2 class="size-3.5" />
						Full View
					</Button>
				</div>
			</Sheet.Header>
			<div class="flex flex-col gap-6 px-4 pb-8">
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Invention
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Title of Invention</dt>
							<dd class="font-medium">{data.title_of_invention}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Type of Invention</dt>
							<dd class="font-medium">{data.type_of_invention?.name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Pre-Protection Status</dt>
							<dd class="font-medium">{data.pre_protection_status?.name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Office Action</dt>
							<dd class="font-medium">{data.type_of_office_action?.name ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Inventor(s)</dt>
							<dd class="font-medium">
								{#if data.inventor_names && data.inventor_names.length > 0}
									{data.inventor_names.join(', ')}
								{:else}
									—
								{/if}
							</dd>
						</div>
					</dl>
				</section>

				<Separator />
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Client
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Name</dt>
							<dd class="font-medium">{data.client_profiles?.first_name ?? '—'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium">{data.client_profiles?.email ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Contact Details</dt>
							<dd class="font-medium">
								{#if data.contact_details && data.contact_details.length > 0}
									{data.contact_details.join(', ')}
								{:else}
									—
								{/if}
							</dd>
						</div>
					</dl>
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
