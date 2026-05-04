<script lang="ts">
	import type { PageProps } from './$types';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ReportSelector from '$lib/components/admin/reports/ReportSelector.svelte';
	import ReportControls from '$lib/components/admin/reports/ReportControls.svelte';
	import MonthlyFilingReport from '$lib/components/admin/reports/MonthlyFilingReport.svelte';
	import ClientStatisticsReport from '$lib/components/admin/reports/ClientStatisticsReport.svelte';
	import DataIntegrityReport from '$lib/components/admin/reports/DataIntegrityReport.svelte';
	import ExportPdfButton from '$lib/components/admin/reports/ExportPdfButton.svelte';

	let { data }: PageProps = $props();

	type ReportType = 'monthly' | 'client' | 'integrity';
	let selectedReport = $state<ReportType>('monthly');
	let isGenerated = $state(false);
	let isGenerating = $state(false);

	const reportElementId = $derived(
		selectedReport === 'monthly'
			? 'monthly-filing-report'
			: selectedReport === 'client'
				? 'client-statistics-report'
				: selectedReport === 'integrity'
					? 'data-integrity-report'
					: ''
	);

	const pdfFilename = $derived(() => {
		const base =
			selectedReport === 'monthly'
				? 'monthly_filing_report'
				: selectedReport === 'client'
					? 'client_statistics_report'
					: selectedReport === 'integrity'
						? 'data_integrity_security_report'
						: 'report';
		return `${base}_${data.periodLabel.replace(/[\s,–]/g, '_')}`;
	});

	async function handleGenerate(params: {
		month: number;
		year: number;
		dateFrom: string;
		dateTo: string;
	}) {
		isGenerating = true;
		const searchParams = new SvelteURLSearchParams();
		searchParams.set('month', String(params.month));
		searchParams.set('year', String(params.year));
		if (params.dateFrom) searchParams.set('dateFrom', params.dateFrom);
		if (params.dateTo) searchParams.set('dateTo', params.dateTo);

		await goto(`/reports?${searchParams.toString()}`, {
			invalidateAll: true,
			keepFocus: true,
			noScroll: true
		});

		isGenerated = true;
		isGenerating = false;
	}

	function handleSelectReport(type: ReportType) {
		selectedReport = type;
		isGenerated = false;
	}
</script>

<div class="flex flex-col gap-6 p-6">
	<!-- Header -->
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Generate Report</h1>
		<p class="text-sm text-muted-foreground">
			Select a report type, configure the period, and generate detailed business insights
		</p>
	</div>

	<!-- Report Type Selector -->
	<ReportSelector selected={selectedReport} onselect={handleSelectReport} />

	<!-- Controls -->
	<div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
		<div class="flex-1">
			<ReportControls
				selectedMonth={data.selectedMonth}
				selectedYear={data.selectedYear}
				dateFrom={data.dateFrom}
				dateTo={data.dateTo}
				onGenerate={handleGenerate}
				{isGenerating}
			/>
		</div>

		{#if isGenerated && reportElementId}
			<ExportPdfButton targetElementId={reportElementId} filename={pdfFilename()} />
		{/if}
	</div>

	<!-- Report Preview -->
	{#if isGenerated}
		{#if selectedReport === 'monthly'}
			<MonthlyFilingReport
				currentApplications={data.currentApplications}
				prevApplications={data.prevApplications}
				currentPayments={data.currentPayments}
				prevPayments={data.prevPayments}
				trendData={data.trendData}
				companySettings={data.companySettings}
				periodLabel={data.periodLabel}
				generatedAt={data.generatedAt}
			/>
		{:else if selectedReport === 'client'}
			<ClientStatisticsReport
				clients={data.clients}
				clientFilings={data.clientFilings}
				companySettings={data.companySettings}
				periodLabel={data.periodLabel}
				generatedAt={data.generatedAt}
			/>
		{:else if selectedReport === 'integrity'}
			<DataIntegrityReport
				auditLogs={data.auditLogs}
				auditTrendData={data.auditTrendData}
				companySettings={data.companySettings}
				periodLabel={data.periodLabel}
				generatedAt={data.generatedAt}
			/>
		{/if}
	{:else}
		<div
			class="flex flex-col items-center justify-center rounded-lg border border-dashed bg-muted/20 py-16"
		>
			<div class="flex size-12 items-center justify-center rounded-full bg-muted">
				<svg
					class="size-6 text-muted-foreground"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
					stroke-width="1.5"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
					/>
				</svg>
			</div>
			<p class="mt-3 text-sm font-medium text-muted-foreground">No report generated yet</p>
			<p class="mt-1 text-xs text-muted-foreground">
				Select a report type and click "Generate Report" to begin
			</p>
		</div>
	{/if}
</div>
