<script lang="ts">
	import type { PageProps } from './$types';
	import ApplicationSection from '$lib/components/admin/files/client/ApplicationSection.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, ArrowLeft } from '@lucide/svelte';

	let { data }: PageProps = $props();

	const clientName = $derived(
		[data.client.first_name, data.client.middle_name, data.client.last_name]
			.filter(Boolean)
			.join(' ')
	);

	const currentUserId = $derived(data.profile.user_id);

	function getFilesForApplication(applicationNumber: string) {
		return data.files.filter((f) => f.application_number === applicationNumber);
	}
</script>

<main class="p-4">
	<div class="mb-6 flex items-center gap-3">
		<Button variant="outline" size="icon" href="/files">
			<ArrowLeft class="size-4" />
		</Button>
		<div>
			<h1 class="text-lg font-semibold">{clientName}</h1>
			<p class="text-sm text-muted-foreground">{data.client.company_name}</p>
		</div>
	</div>

	{#if data.error}
		<div class="flex flex-col items-center justify-center space-y-3 py-12 text-center">
			<AlertCircle class="size-8 text-primary/70" />
			<p class="text-sm font-medium text-primary/60">{data.error}</p>
		</div>
	{:else if data.applications.length === 0}
		<p class="py-12 text-center text-muted-foreground">No applications found for this client.</p>
	{:else}
		<div class="flex flex-col">
			{#each data.applications as app (app.application_number)}
				<ApplicationSection
					{app}
					files={getFilesForApplication(app.application_number)}
					{currentUserId}
				/>
			{/each}
		</div>
	{/if}
</main>
