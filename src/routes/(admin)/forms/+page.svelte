<script lang="ts">
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/shadcn/components/ui/tabs';
	import { FileText, Shield } from '@lucide/svelte';
	import IPApplicationForm from '$lib/components/filing-forms/ip-application/IPApplicationForm.svelte';

	let { data } = $props();
</script>

<main class="p-6">
	<h1 class="mb-6 text-2xl font-semibold">Filing Forms</h1>

	<Tabs value="ip-application">
		<TabsList class="mb-6">
			<TabsTrigger value="ip-application" class="flex items-center gap-2">
				<FileText class="size-4" />
				IP Application
			</TabsTrigger>
			<TabsTrigger value="power-of-attorney" class="flex items-center gap-2">
				<Shield class="size-4" />
				Power of Attorney
			</TabsTrigger>
		</TabsList>

		<TabsContent value="ip-application">
			<IPApplicationForm
				inventionTypes={data.inventionTypes}
				protectionStatuses={data.protectionStatuses}
				officeActions={data.officeActions}
			/>
		</TabsContent>

		<TabsContent value="power-of-attorney">
			<p class="text-muted-foreground">Power of Attorney form content goes here.</p>
		</TabsContent>
	</Tabs>
</main>
