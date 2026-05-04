<script lang="ts">
	import dmvLogo from '$lib/assets/dmv-logo.svg';

	interface ReportHeaderProps {
		companyName: string;
		subtitle: string;
		periodLabel: string;
		generatedAt: string;
	}

	let { companyName, subtitle, periodLabel, generatedAt }: ReportHeaderProps = $props();
</script>

<div class="flex items-start justify-between border-b-2 border-primary/20 pb-4">
	<div class="flex items-center gap-3">
		<img src={dmvLogo} alt="DMV Logo" class="h-12 w-auto" />
		<div>
			<h2 class="text-lg font-bold tracking-tight text-foreground">{companyName}</h2>
			<p class="text-xs text-muted-foreground">{subtitle}</p>
		</div>
	</div>
	<div class="text-right">
		<p class="text-lg font-semibold text-foreground">{periodLabel}</p>
		<p class="text-xs text-muted-foreground">Generated: {generatedAt}</p>
	</div>
</div>
