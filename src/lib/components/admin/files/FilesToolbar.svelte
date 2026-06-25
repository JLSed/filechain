<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import * as DropdownMenu from '$lib/shadcn/components/ui/dropdown-menu/index.js';
	import type { ClientFolderState } from '$lib/classes/TableClass.svelte';
	import { ChevronDown } from '@lucide/svelte';

	interface Props {
		table: ClientFolderState;
		isSystemAdmin: boolean;
		userRole: string | null;
	}

	let { table, isSystemAdmin, userRole }: Props = $props();
</script>

<div class="flex flex-wrap items-center gap-2">
	<!-- Type Filter -->
	<DropdownMenu.Root>
		<DropdownMenu.Trigger>
			{#snippet child({ props })}
				<Button
					{...props}
					variant={table.selectedType !== 'all' ? 'secondary' : 'outline'}
					class="h-10 gap-1 rounded-lg border-border text-xs font-normal"
				>
					Type: {table.selectedType === 'all'
						? 'All'
						: table.selectedType === 'individual'
							? 'Individual'
							: 'Company'}
					<ChevronDown class="size-3 text-muted-foreground" />
				</Button>
			{/snippet}
		</DropdownMenu.Trigger>
		<DropdownMenu.Content align="start">
			<DropdownMenu.RadioGroup bind:value={table.selectedType}>
				<DropdownMenu.RadioItem value="all" onclick={() => (table.currentPage = 1)}>
					All Types
				</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="individual" onclick={() => (table.currentPage = 1)}>
					Individual
				</DropdownMenu.RadioItem>
				<DropdownMenu.RadioItem value="company" onclick={() => (table.currentPage = 1)}>
					Company
				</DropdownMenu.RadioItem>
			</DropdownMenu.RadioGroup>
		</DropdownMenu.Content>
	</DropdownMenu.Root>

	<!-- Team Filter -->
	{#if isSystemAdmin}
		<DropdownMenu.Root>
			<DropdownMenu.Trigger>
				{#snippet child({ props })}
					<Button
						{...props}
						variant={table.selectedTeam !== 'all' ? 'secondary' : 'outline'}
						class="h-10 gap-1 rounded-lg border-border text-xs font-normal"
					>
						Team: {table.selectedTeam === 'all' ? 'All Teams' : table.selectedTeam}
						<ChevronDown class="size-3 text-muted-foreground" />
					</Button>
				{/snippet}
			</DropdownMenu.Trigger>
			<DropdownMenu.Content align="start">
				<DropdownMenu.RadioGroup bind:value={table.selectedTeam}>
					<DropdownMenu.RadioItem value="all" onclick={() => (table.currentPage = 1)}>
						All Teams
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="Patent Team" onclick={() => (table.currentPage = 1)}>
						Patent Team
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="Copyright Team" onclick={() => (table.currentPage = 1)}>
						Copyright Team
					</DropdownMenu.RadioItem>
					<DropdownMenu.RadioItem value="TM Team" onclick={() => (table.currentPage = 1)}>
						TM Team
					</DropdownMenu.RadioItem>
				</DropdownMenu.RadioGroup>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	{:else}
		<Button
			variant="secondary"
			class="h-10 cursor-default gap-1 rounded-lg border-border text-xs font-normal opacity-85 hover:bg-secondary"
			disabled
		>
			Team: {userRole || 'My Team'}
		</Button>
	{/if}
</div>
