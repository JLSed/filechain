<script lang="ts">
	import { ShieldCheck } from '@lucide/svelte';
</script>

<div
	class="flex flex-col items-center justify-center rounded-lg border bg-background p-12 shadow-sm"
>
	<div class="flex size-16 items-center justify-center rounded-full bg-muted">
		<ShieldCheck class="size-8 text-muted-foreground" />
	</div>
	<h3 class="mt-4 text-lg font-semibold text-foreground">Data Integrity & Security Report</h3>
	<p class="mt-2 max-w-md text-center text-sm text-muted-foreground">
		This section will provide insights into data integrity verification, file encryption status,
		audit trail analysis, and system security metrics.
	</p>
	<span
		class="mt-4 inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
	>
		Coming Soon
	</span>
</div>
