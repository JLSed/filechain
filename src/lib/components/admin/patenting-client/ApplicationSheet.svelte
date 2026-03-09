<script lang="ts">
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import type { IpApplication } from '$lib/types/DatabaseTypes';
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
				<Sheet.Title>Application Details</Sheet.Title>
				<Sheet.Description>{data.status}</Sheet.Description>
				<Sheet.Description>{data.application_number}</Sheet.Description>
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
							<dd class="font-medium">{data.client_profiles.first_name}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium">{data.client_profiles.email ?? '—'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Contact Details</dt>
							<dd class="font-medium">{data.contact_details ?? '—'}</dd>
						</div>
					</dl>
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
