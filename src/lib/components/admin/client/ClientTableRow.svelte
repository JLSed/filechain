<script lang="ts">
	import * as Table from '$lib/shadcn/components/ui/table/index.js';
	import type { ClientProfile } from '$lib/types/DatabaseTypes';
	import { Building2, User } from '@lucide/svelte';
	import { formatName } from '$lib/utils/formatter';

	interface ComponentProps {
		client: ClientProfile;
	}

	let { client }: ComponentProps = $props();

	const isCompany = $derived(client.company_name && !client.is_individual);
	const clientName = $derived(
		isCompany
			? client.company_name
			: formatName(client.first_name, client.middle_name, client.last_name)
	);
</script>

<Table.Row class="group cursor-pointer">
	<Table.Cell class="font-medium">
		<a href={`/client/${client.client_id}`} class="block h-full w-full py-2">
			{clientName}
		</a>
	</Table.Cell>
	<Table.Cell>
		<a href={`/client/${client.client_id}`} class="block h-full w-full py-2">
			{#if isCompany}
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<Building2 class="size-4" />
					<span>Company</span>
				</div>
			{:else}
				<div class="flex items-center gap-1.5 text-muted-foreground">
					<User class="size-4" />
					<span>Individual</span>
				</div>
			{/if}
		</a>
	</Table.Cell>
	<Table.Cell>
		<a href={`/client/${client.client_id}`} class="block h-full w-full py-2">
			{client.email || 'N/A'}
		</a>
	</Table.Cell>
	<Table.Cell>
		<a href={`/client/${client.client_id}`} class="block h-full w-full py-2">
			{client.mobile_number || 'N/A'}
		</a>
	</Table.Cell>
</Table.Row>
