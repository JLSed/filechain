<script>
	import { Ellipsis, Eye, Pencil } from '@lucide/svelte';
	import * as ContextMenu from '$lib/shadcn/components/ui/context-menu/index.js';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import { Checkbox } from '$lib/shadcn/components/ui/checkbox/index.js';
	import { Button } from '$lib/shadcn/components/ui/button/index.js';
	import { Badge } from '$lib/shadcn/components/ui/badge/index.js';
	let { app, getClientName, getStatusStyle, formatDate, openDetails } = $props();
</script>

<ContextMenu.Root>
	<ContextMenu.Trigger>
		{#snippet child({ props })}
			<Table.Row {...props} class="h-16">
				<Table.Cell>
					<Checkbox />
				</Table.Cell>
				<Table.Cell class="font-mono text-sm font-medium">
					{app.application_number}
				</Table.Cell>
				<Table.Cell>
					<div class="flex flex-col">
						<span class="text-sm font-medium">{app.title_of_invention}</span>
						{#if app.type_of_invention_name}
							<span class="text-xs text-muted-foreground">{app.type_of_invention_name}</span>
						{/if}
					</div>
				</Table.Cell>
				<Table.Cell>
					<div class="flex flex-col">
						<span class="text-sm">{getClientName(app)}</span>
						{#if app.client_email}
							<span class="text-xs text-muted-foreground">{app.client_email}</span>
						{/if}
					</div>
				</Table.Cell>
				<Table.Cell>
					{@const style = getStatusStyle(app.status)}
					<Badge variant="outline" class="gap-1.5 font-normal {style.badge}">
						<span class="size-1.5 rounded-full {style.dot}"></span>
						{app.status}
					</Badge>
				</Table.Cell>
				<Table.Cell class="text-sm text-muted-foreground">
					{formatDate(app.filling_date)}
				</Table.Cell>
				<Table.Cell class="text-sm text-muted-foreground">
					{formatDate(app.deadline)}
				</Table.Cell>
				<Table.Cell>
					<DropdownMenu.Root>
						<DropdownMenu.Trigger>
							<Button variant="ghost" size="icon" class="size-8">
								<Ellipsis class="size-4" />
							</Button>
						</DropdownMenu.Trigger>
						<DropdownMenu.Content align="end">
							<DropdownMenu.Item onclick={() => openDetails(app)}>
								<Eye class="mr-2 size-4" />
								View details
							</DropdownMenu.Item>
							<DropdownMenu.Item>
								<Pencil class="mr-2 size-4" />
								Edit application
							</DropdownMenu.Item>
							<DropdownMenu.Separator />
							<DropdownMenu.Item class="text-destructive">Delete</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Root>
				</Table.Cell>
			</Table.Row>
		{/snippet}
	</ContextMenu.Trigger>
	<ContextMenu.Content class="w-48">
		<ContextMenu.Item onclick={() => openDetails(app)}>
			<Eye class="mr-2 size-4" />
			View Details
		</ContextMenu.Item>
		<ContextMenu.Item>
			<Pencil class="mr-2 size-4" />
			Edit Application
		</ContextMenu.Item>
	</ContextMenu.Content>
</ContextMenu.Root>
