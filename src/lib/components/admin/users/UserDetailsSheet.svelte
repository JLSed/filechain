<script lang="ts">
	import Separator from '$lib/shadcn/components/ui/separator/separator.svelte';
	import * as Sheet from '$lib/shadcn/components/ui/sheet/index.js';
	import Badge from '$lib/shadcn/components/ui/badge/badge.svelte';
	import type { UserProfile } from '$lib/types/DatabaseTypes';
	import { formatDate } from '$lib/utils/formatter';

	interface ComponentProps {
		data: UserProfile | null;
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
				<Sheet.Title>User Details</Sheet.Title>
				<Sheet.Description>
					{#if !data.is_active}
						<Badge variant="secondary">Archived</Badge>
					{:else if data.has_secret}
						<Badge variant="default" class="bg-emerald-600 hover:bg-emerald-700">Active</Badge>
					{:else}
						<Badge
							variant="outline"
							class="border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400"
							>Invited</Badge
						>
					{/if}
				</Sheet.Description>
			</Sheet.Header>
			<div class="flex flex-col gap-6 px-4 pb-8">
				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Personal Information
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">First Name</dt>
							<dd class="font-medium">{data.first_name ?? 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Last Name</dt>
							<dd class="font-medium">{data.last_name ?? 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Middle Name</dt>
							<dd class="font-medium">{data.middle_name ?? 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Role</dt>
							<dd class="font-medium">
								{#if data.role}
									<Badge variant="outline">{data.role}</Badge>
								{:else}
									<span class="text-muted-foreground italic">No role assigned</span>
								{/if}
							</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Contact Details
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Email</dt>
							<dd class="font-medium">{data.email ?? 'N/A'}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Contact Number</dt>
							<dd class="font-medium">{data.contact_number ?? 'N/A'}</dd>
						</div>
						<div class="sm:col-span-2">
							<dt class="text-muted-foreground">Address</dt>
							<dd class="font-medium">{data.address ?? 'N/A'}</dd>
						</div>
					</dl>
				</section>

				<Separator />

				<section>
					<h3 class="mb-3 text-sm font-semibold tracking-wider text-muted-foreground uppercase">
						Account
					</h3>
					<dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
						<div>
							<dt class="text-muted-foreground">Created At</dt>
							<dd class="font-medium">{formatDate(data.created_at)}</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">User ID</dt>
							<dd class="font-mono text-xs font-medium break-all">{data.user_id}</dd>
						</div>
					</dl>
				</section>
			</div>
		{/if}
	</Sheet.Content>
</Sheet.Root>
