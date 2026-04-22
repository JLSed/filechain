<script lang="ts">
	import type { PageProps } from './$types';
	import type { ApplicationTask } from '$lib/types/DatabaseTypes';
	import ApplicationCard from '$lib/components/admin/timeline/ApplicationCard.svelte';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { AlertCircle, RefreshCcw } from '@lucide/svelte';
	import { invalidate } from '$app/navigation';
	import { SvelteMap } from 'svelte/reactivity';

	let { data }: PageProps = $props();

	let isRefreshing = $state(false);

	async function handleRefresh(): Promise<void> {
		isRefreshing = true;
		await invalidate('db:timeline');
		isRefreshing = false;
	}

	/** Group tasks by application_id for efficient lookup */
	const tasksByApp = $derived.by(() => {
		const map = new SvelteMap<string, ApplicationTask[]>();
		for (const task of data.tasks) {
			const existing = map.get(task.application_id) ?? [];
			existing.push(task);
			map.set(task.application_id, existing);
		}
		return map;
	});
</script>

<main class="p-4 lg:p-6">
	<div class="mb-6 flex items-center justify-between">
		<div>
			<h1 class="text-lg font-semibold">Application Timeline</h1>
			<p class="text-sm text-muted-foreground">Track progress and manage applications tasks</p>
		</div>
		<Button variant="outline" size="icon" disabled={isRefreshing} onclick={handleRefresh}>
			<RefreshCcw class="size-4 {isRefreshing ? 'animate-spin' : ''}" />
		</Button>
	</div>

	{#if data.error}
		<div class="flex flex-col items-center justify-center space-y-3 py-20 text-center">
			<AlertCircle class="size-8 text-primary/70" />
			<p class="text-sm font-medium text-primary/60">{data.error}</p>
			<Button variant="outline" size="sm" onclick={handleRefresh}>Try Again</Button>
		</div>
	{:else if data.applications.length === 0}
		<div class="flex flex-col items-center justify-center space-y-3 py-20 text-center">
			<p class="text-sm text-muted-foreground">No applications assigned to you.</p>
		</div>
	{:else}
		<div class="grid gap-5 xl:grid-cols-1">
			{#each data.applications as application (application.application_id)}
				<ApplicationCard
					{application}
					tasks={tasksByApp.get(application.application_id) ?? []}
					userId={data.profile.user_id}
				/>
			{/each}
		</div>
	{/if}
</main>
