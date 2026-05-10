<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ReportSelector from '$lib/components/admin/reports/ReportSelector.svelte';
	import ReportControls from '$lib/components/admin/reports/ReportControls.svelte';
	import MonthlyFilingReport from '$lib/components/admin/reports/MonthlyFilingReport.svelte';
	import ClientStatisticsReport from '$lib/components/admin/reports/ClientStatisticsReport.svelte';
	import DataIntegrityReport from '$lib/components/admin/reports/DataIntegrityReport.svelte';
	import ExportPdfButton from '$lib/components/admin/reports/ExportPdfButton.svelte';
	import { hasPermission } from '$lib/services/permissions';
	import { PdfReportBuilder, svgToImageDataUrl } from '$lib/services/pdf-export';
	import type { PdfHighlight } from '$lib/services/pdf-export';

	let { data }: PageProps = $props();

	const permissions = $derived($page.data.permissions as string[]);
	const canGenerateReport = $derived(hasPermission(permissions, 'reports.generate'));

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

	const pdfFilename = $derived(
		(() => {
			const base =
				selectedReport === 'monthly'
					? 'monthly_filing_report'
					: selectedReport === 'client'
						? 'client_statistics_report'
						: selectedReport === 'integrity'
							? 'data_integrity_security_report'
							: 'report';
			return `${base}_${data.periodLabel.replace(/[\s,–]/g, '_')}`;
		})()
	);

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

	// ── PDF Helper: capture SVG charts from the rendered report ─────

	async function captureChartImages(containerId: string): Promise<string[]> {
		const container = document.getElementById(containerId);
		if (!container) return [];
		const svgs = container.querySelectorAll<SVGSVGElement>('svg.layerchart-chart, svg');
		const results: string[] = [];
		for (const svg of svgs) {
			// Skip tiny icons (lucide icons are typically 24x24 or smaller)
			const bbox = svg.getBoundingClientRect();
			if (bbox.width < 80 || bbox.height < 80) continue;
			try {
				const dataUrl = await svgToImageDataUrl(svg, Math.round(bbox.width), Math.round(bbox.height));
				results.push(dataUrl);
			} catch {
				// Skip charts that fail to render
			}
		}
		return results;
	}

	// ── Currency/number formatting (mirrors report components) ──────

	function formatCurrency(val: number): string {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
	}

	function formatCompact(val: number): string {
		if (val >= 1000000) return `₱${(val / 1000000).toFixed(1)}M`;
		if (val >= 1000) return `₱${(val / 1000).toFixed(0)}K`;
		return formatCurrency(val);
	}

	function pctChange(current: number, prev: number): string {
		if (prev === 0) return current > 0 ? '+100%' : '0%';
		const pct = ((current - prev) / prev) * 100;
		return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
	}

	// ── Build PDF for Monthly Filing Report ─────────────────────────

	function getTypeName(app: { type_of_invention?: { name: string } | { name: string }[] | null }): string {
		if (!app.type_of_invention) return 'Unknown';
		if (Array.isArray(app.type_of_invention)) return app.type_of_invention[0]?.name || 'Unknown';
		return app.type_of_invention.name || 'Unknown';
	}

	async function buildMonthlyPdf(): Promise<void> {
		const { currentApplications, prevApplications, currentPayments, prevPayments, companySettings, periodLabel, generatedAt } = data;

		const totalFilings = currentApplications.length;
		const prevFilings = prevApplications.length;
		const totalRevenue = currentPayments.reduce((s: number, p: { amount: number | string }) => s + Number(p.amount ?? 0), 0);
		const prevRevenueVal = prevPayments.reduce((s: number, p: { amount: number | string }) => s + Number(p.amount ?? 0), 0);
		const avgRevenue = totalFilings > 0 ? totalRevenue / totalFilings : 0;

		// Type breakdown
		const typeMap: Record<string, { name: string; count: number; revenue: number }> = {};
		for (const app of currentApplications) {
			const name = getTypeName(app);
			if (!typeMap[name]) typeMap[name] = { name, count: 0, revenue: 0 };
			typeMap[name].count += 1;
		}
		const entries = Object.values(typeMap);
		if (totalFilings > 0) {
			for (const e of entries) e.revenue = (e.count / totalFilings) * totalRevenue;
		}

		const builder = new PdfReportBuilder();
		builder.addHeader({ companyName: companySettings.company_name, subtitle: 'Monthly Filing Report', periodLabel, generatedAt });

		builder.addSummaryCards([
			{ label: 'Total Filings', value: String(totalFilings), subtitle: `${pctChange(totalFilings, prevFilings)} vs prev month` },
			{ label: 'Total Revenue', value: formatCompact(totalRevenue), subtitle: `${pctChange(totalRevenue, prevRevenueVal)} vs prev month` },
			{ label: 'Avg Revenue/Filing', value: formatCurrency(avgRevenue), subtitle: 'Per application' }
		]);

		// Chart images
		const charts = await captureChartImages('monthly-filing-report');
		for (let i = 0; i < charts.length; i++) {
			const titles = ['Filing Breakdown by IP Type', 'Revenue Distribution', '6-Month Filing Trend'];
			builder.addChartImage(charts[i], { title: titles[i] ?? `Chart ${i + 1}` });
		}

		// Detailed statistics table
		builder.addTable({
			title: 'Detailed Statistics',
			columns: [
				{ header: 'IP Type', key: 'name' },
				{ header: 'Filings', key: 'count', align: 'right' },
				{ header: 'Revenue', key: 'revenue', align: 'right' },
				{ header: 'Avg/Filing', key: 'avg', align: 'right' },
				{ header: '% of Total', key: 'pct', align: 'right' }
			],
			rows: [
				...entries.map((e) => ({
					name: e.name,
					count: String(e.count),
					revenue: formatCurrency(e.revenue),
					avg: formatCurrency(e.count > 0 ? e.revenue / e.count : 0),
					pct: totalFilings > 0 ? `${((e.count / totalFilings) * 100).toFixed(1)}%` : '0.0%'
				})),
				{ name: 'Total', count: String(totalFilings), revenue: formatCurrency(totalRevenue), avg: formatCurrency(avgRevenue), pct: '100%' }
			]
		});

		// Highlights
		const highlights: PdfHighlight[] = [];
		if (totalFilings > prevFilings) highlights.push({ text: `Filings increased by ${pctChange(totalFilings, prevFilings)} compared to previous month`, type: 'positive' });
		else if (totalFilings < prevFilings) highlights.push({ text: `Filings decreased by ${pctChange(totalFilings, prevFilings)} compared to previous month`, type: 'negative' });
		if (totalRevenue > prevRevenueVal) highlights.push({ text: `Overall revenue grew by ${pctChange(totalRevenue, prevRevenueVal)}`, type: 'positive' });
		else if (totalRevenue < prevRevenueVal) highlights.push({ text: `Revenue declined by ${pctChange(totalRevenue, prevRevenueVal)} vs previous month`, type: 'negative' });
		const topType = entries.sort((a, b) => b.count - a.count)[0];
		if (topType) highlights.push({ text: `${topType.name} applications lead with ${topType.count} filings this period`, type: 'neutral' });
		if (highlights.length === 0) highlights.push({ text: 'No significant changes detected this period', type: 'neutral' });
		builder.addHighlights(highlights);

		builder.addFooter({ companyName: companySettings.company_name, contactInfo: companySettings.contact_info, registeredAddress: companySettings.registered_address });
		await builder.save(pdfFilename);
	}

	// ── Build PDF for Client Statistics Report ──────────────────────

	async function buildClientPdf(): Promise<void> {
		const { clients, clientFilings, companySettings, periodLabel, generatedAt } = data;

		const totalClients = clients.length;
		const individualClients = clients.filter((c: { is_individual: boolean }) => c.is_individual).length;
		const companyClients = totalClients - individualClients;
		const totalFilingsCount = clientFilings.length;

		const builder = new PdfReportBuilder();
		builder.addHeader({ companyName: companySettings.company_name, subtitle: 'Client Statistics Report', periodLabel, generatedAt });

		builder.addSummaryCards([
			{ label: 'Total Clients', value: String(totalClients), subtitle: 'All registered clients' },
			{ label: 'Individual Clients', value: String(individualClients), subtitle: totalClients > 0 ? `${((individualClients / totalClients) * 100).toFixed(0)}% of total` : '0%' },
			{ label: 'Company Clients', value: String(companyClients), subtitle: totalClients > 0 ? `${((companyClients / totalClients) * 100).toFixed(0)}% of total` : '0%' }
		]);

		// Charts
		const charts = await captureChartImages('client-statistics-report');
		for (let i = 0; i < charts.length; i++) {
			const titles = ['Client Type Distribution', 'Top Nationalities'];
			builder.addChartImage(charts[i], { title: titles[i] ?? `Chart ${i + 1}` });
		}

		// Nationality ranking
		const natCounts: Record<string, number> = {};
		for (const c of clients) {
			const nat = (c as { nationality?: string | null }).nationality?.trim() || 'Not Specified';
			natCounts[nat] = (natCounts[nat] ?? 0) + 1;
		}
		const natRanking = Object.entries(natCounts).map(([n, count]) => ({ nationality: n, count })).sort((a, b) => b.count - a.count);

		builder.addTable({
			title: 'Nationality Ranking',
			columns: [
				{ header: 'Rank', key: 'rank', widthFraction: 0.1 },
				{ header: 'Nationality', key: 'nationality' },
				{ header: 'Clients', key: 'count', align: 'right', widthFraction: 0.15 },
				{ header: '%', key: 'pct', align: 'right', widthFraction: 0.15 }
			],
			rows: natRanking.map((n, i) => ({
				rank: String(i + 1),
				nationality: n.nationality,
				count: String(n.count),
				pct: totalClients > 0 ? `${((n.count / totalClients) * 100).toFixed(1)}%` : '0.0%'
			}))
		});

		// Client filing ranking
		type ClientProfile = { client_id: string; first_name: string; last_name: string; is_individual: boolean; company_name?: string | null };
		const filingCounts: Record<string, { name: string; type: string; count: number }> = {};
		for (const f of clientFilings) {
			const raw = (f as unknown as { client_profiles?: ClientProfile | ClientProfile[] | null }).client_profiles;
			const cp = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
			if (!cp) continue;
			if (!filingCounts[cp.client_id]) {
				const name = !cp.is_individual && cp.company_name ? cp.company_name : [cp.first_name, cp.last_name].filter(Boolean).join(' ');
				filingCounts[cp.client_id] = { name, type: cp.is_individual ? 'Individual' : 'Company', count: 0 };
			}
			filingCounts[cp.client_id].count += 1;
		}
		const topClients = Object.values(filingCounts).sort((a, b) => b.count - a.count).slice(0, 10);

		builder.addTable({
			title: 'Client Filing Ranking',
			columns: [
				{ header: 'Rank', key: 'rank', widthFraction: 0.08 },
				{ header: 'Client Name', key: 'name' },
				{ header: 'Type', key: 'type', widthFraction: 0.15 },
				{ header: 'Filings', key: 'count', align: 'right', widthFraction: 0.12 },
				{ header: '% of Total', key: 'pct', align: 'right', widthFraction: 0.12 }
			],
			rows: topClients.map((c, i) => ({
				rank: String(i + 1),
				name: c.name,
				type: c.type,
				count: String(c.count),
				pct: totalFilingsCount > 0 ? `${((c.count / totalFilingsCount) * 100).toFixed(1)}%` : '0.0%'
			}))
		});

		// Highlights
		const highlights: PdfHighlight[] = [];
		if (totalClients > 0) highlights.push({ text: `Individual clients make up ${((individualClients / totalClients) * 100).toFixed(0)}% of the total client base`, type: 'neutral' });
		const topNat = natRanking[0];
		if (topNat && totalClients > 0) highlights.push({ text: `${topNat.nationality} nationals account for ${((topNat.count / totalClients) * 100).toFixed(0)}% of all clients`, type: 'neutral' });
		const topClient = topClients[0];
		if (topClient) highlights.push({ text: `${topClient.name} leads with ${topClient.count} total filings`, type: 'positive' });
		if (highlights.length === 0) highlights.push({ text: 'No client data available for analysis', type: 'neutral' });
		builder.addHighlights(highlights);

		builder.addFooter({ companyName: companySettings.company_name, contactInfo: companySettings.contact_info, registeredAddress: companySettings.registered_address });
		await builder.save(pdfFilename);
	}

	// ── Build PDF for Data Integrity Report ─────────────────────────

	async function buildIntegrityPdf(): Promise<void> {
		const { auditLogs, companySettings, periodLabel, generatedAt } = data;

		const SEVERITY_LABELS: Record<string, string> = { danger: 'Danger', warning: 'Warning', notice: 'Notice', neutral: 'Neutral' };

		const totalEvents = auditLogs.length;
		const dangerEvents = auditLogs.filter((l: { severity_level: string }) => l.severity_level === 'danger').length;
		const warningEvents = auditLogs.filter((l: { severity_level: string }) => l.severity_level === 'warning').length;
		const uniqueUsers = new Set(auditLogs.filter((l: { actor_id: string | null }) => l.actor_id).map((l: { actor_id: string | null }) => l.actor_id)).size;

		const builder = new PdfReportBuilder();
		builder.addHeader({ companyName: companySettings.company_name, subtitle: 'Data Integrity & Security Report', periodLabel, generatedAt });

		builder.addSummaryCards([
			{ label: 'Total Audit Events', value: String(totalEvents), subtitle: 'In selected period' },
			{ label: 'Danger Events', value: String(dangerEvents), subtitle: totalEvents > 0 ? `${((dangerEvents / totalEvents) * 100).toFixed(1)}% of total` : 'No events' },
			{ label: 'Warning Events', value: String(warningEvents), subtitle: totalEvents > 0 ? `${((warningEvents / totalEvents) * 100).toFixed(1)}% of total` : 'No events' },
			{ label: 'Active Users', value: String(uniqueUsers), subtitle: 'Users with logged activity' }
		]);

		// Charts
		const charts = await captureChartImages('data-integrity-report');
		for (let i = 0; i < charts.length; i++) {
			const titles = ['Severity Distribution', 'Event Types', '6-Month Audit Trail Trend'];
			builder.addChartImage(charts[i], { title: titles[i] ?? `Chart ${i + 1}` });
		}

		// Event type table
		const evtCounts: Record<string, number> = {};
		for (const log of auditLogs) {
			const evt = (log as { event_type: string }).event_type || 'Unknown';
			evtCounts[evt] = (evtCounts[evt] ?? 0) + 1;
		}
		const evtBreakdown = Object.entries(evtCounts).map(([event, count]) => ({ event, count })).sort((a, b) => b.count - a.count);

		builder.addTable({
			title: 'Event Type Statistics',
			columns: [
				{ header: 'Event Type', key: 'event' },
				{ header: 'Count', key: 'count', align: 'right', widthFraction: 0.15 },
				{ header: '% of Total', key: 'pct', align: 'right', widthFraction: 0.15 }
			],
			rows: [
				...evtBreakdown.map((e) => ({
					event: e.event,
					count: String(e.count),
					pct: totalEvents > 0 ? `${((e.count / totalEvents) * 100).toFixed(1)}%` : '0.0%'
				})),
				{ event: 'Total', count: String(totalEvents), pct: '100%' }
			]
		});

		// User activity ranking
		type AuditProfile = { first_name: string | null; last_name: string | null; role: string | null };
		const userCounts: Record<string, { name: string; role: string; count: number }> = {};
		for (const log of auditLogs) {
			const l = log as { actor_id: string | null; user_profiles?: AuditProfile | AuditProfile[] | null };
			if (!l.actor_id) continue;
			const profile = Array.isArray(l.user_profiles) ? l.user_profiles[0] : l.user_profiles;
			const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User' : 'Unknown User';
			const role = profile?.role ?? 'N/A';
			if (!userCounts[l.actor_id]) userCounts[l.actor_id] = { name, role, count: 0 };
			userCounts[l.actor_id].count += 1;
		}
		const topUsers = Object.values(userCounts).sort((a, b) => b.count - a.count).slice(0, 10);

		builder.addTable({
			title: 'User Activity Ranking',
			columns: [
				{ header: 'Rank', key: 'rank', widthFraction: 0.08 },
				{ header: 'User', key: 'name' },
				{ header: 'Role', key: 'role', widthFraction: 0.18 },
				{ header: 'Events', key: 'count', align: 'right', widthFraction: 0.12 },
				{ header: '% of Total', key: 'pct', align: 'right', widthFraction: 0.12 }
			],
			rows: topUsers.map((u, i) => ({
				rank: String(i + 1),
				name: u.name,
				role: u.role,
				count: String(u.count),
				pct: totalEvents > 0 ? `${((u.count / totalEvents) * 100).toFixed(1)}%` : '0.0%'
			}))
		});

		// Security alerts table
		const secEvents = auditLogs.filter((l: { severity_level: string }) => l.severity_level === 'danger' || l.severity_level === 'warning').slice(0, 10);
		if (secEvents.length > 0) {
			builder.addTable({
				title: 'Security Alerts',
				columns: [
					{ header: 'Timestamp', key: 'time', widthFraction: 0.2 },
					{ header: 'Severity', key: 'severity', widthFraction: 0.12 },
					{ header: 'Event', key: 'event', widthFraction: 0.2 },
					{ header: 'Details', key: 'details' },
					{ header: 'IP', key: 'ip', widthFraction: 0.15 }
				],
				rows: secEvents.map((e: { timestamp: string; severity_level: string; event_type: string; details: string; ip_address: string | null }) => ({
					time: new Date(e.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
					severity: SEVERITY_LABELS[e.severity_level] ?? e.severity_level,
					event: e.event_type,
					details: e.details,
					ip: e.ip_address ?? '—'
				}))
			});
		}

		// Highlights
		const highlights: PdfHighlight[] = [];
		if (dangerEvents > 0) highlights.push({ text: `${dangerEvents} danger-level event${dangerEvents !== 1 ? 's' : ''} detected — review recommended`, type: 'negative' });
		else highlights.push({ text: 'No danger-level security events recorded in this period', type: 'positive' });
		if (warningEvents > 0) highlights.push({ text: `${warningEvents} warning-level event${warningEvents !== 1 ? 's' : ''} logged — monitor for patterns`, type: 'neutral' });
		if (uniqueUsers > 0) highlights.push({ text: `${uniqueUsers} unique user${uniqueUsers !== 1 ? 's' : ''} generated audit trail entries`, type: 'neutral' });
		const topEvt = evtBreakdown[0];
		if (topEvt && totalEvents > 0) highlights.push({ text: `"${topEvt.event}" is the most frequent event type at ${((topEvt.count / totalEvents) * 100).toFixed(0)}% of total`, type: 'neutral' });
		builder.addHighlights(highlights);

		builder.addFooter({ companyName: companySettings.company_name, contactInfo: companySettings.contact_info, registeredAddress: companySettings.registered_address });
		await builder.save(pdfFilename);
	}

	// ── Unified buildPdf dispatcher ─────────────────────────────────

	async function buildPdf(): Promise<void> {
		if (selectedReport === 'monthly') return buildMonthlyPdf();
		if (selectedReport === 'client') return buildClientPdf();
		if (selectedReport === 'integrity') return buildIntegrityPdf();
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
				disabled={!canGenerateReport}
			/>
		</div>

		{#if isGenerated}
			<ExportPdfButton {buildPdf} />
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
