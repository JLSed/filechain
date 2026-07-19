<script lang="ts">
	import type { PageProps } from './$types';
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import ReportSelector from '$lib/components/admin/reports/ReportSelector.svelte';
	import ReportControls from '$lib/components/admin/reports/ReportControls.svelte';
	import MonthlyFilingReport from '$lib/components/admin/reports/MonthlyFilingReport.svelte';
	import ClientStatisticsReport from '$lib/components/admin/reports/ClientStatisticsReport.svelte';
	import DataIntegrityReport from '$lib/components/admin/reports/DataIntegrityReport.svelte';
	import ExportPdfButton from '$lib/components/admin/reports/ExportPdfButton.svelte';
	import { hasPermission } from '$lib/services/permissions';
	import { PdfReportBuilder } from '$lib/services/pdf-export';
	import type { PdfHighlight } from '$lib/services/pdf-export';
	import { DMV_LOGO_BASE64 } from '$lib/assets/dmv-logo-base64';

	let { data }: PageProps = $props();

	const permissions = $derived(page.data.permissions as string[]);
	const canGenerateReport = $derived(hasPermission(permissions, 'reports.generate'));

	type ReportType = 'monthly' | 'client' | 'integrity';
	let selectedReport = $state<ReportType>('monthly');
	let isGenerated = $state(false);
	let isGenerating = $state(false);

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

	// ── Currency/number formatting (mirrors report components) ──────

	function formatCurrency(val: number): string {
		return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(val);
	}

	function formatPdfCurrency(val: number): string {
		const formatted = formatCurrency(val)
			.replace(/₱/g, 'PHP')
			.replace(/\u00a0/g, ' ')
			.replace(/\u202f/g, ' ')
			.trim();
		if (formatted.startsWith('PHP') && !formatted.startsWith('PHP ')) {
			return 'PHP ' + formatted.slice(3);
		}
		return formatted;
	}

	function formatPdfCompact(val: number): string {
		if (val >= 1000000) return `PHP ${(val / 1000000).toFixed(1)}M`;
		if (val >= 1000) return `PHP ${(val / 1000).toFixed(0)}K`;
		return formatPdfCurrency(val);
	}

	function pctChange(current: number, prev: number): string {
		if (prev === 0) return current > 0 ? '+100%' : '0%';
		const pct = ((current - prev) / prev) * 100;
		return `${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%`;
	}

	// ── Build PDF for Monthly Filing Report ─────────────────────────

	function getTypeName(app: {
		type_of_invention?: { name: string } | { name: string }[] | null;
	}): string {
		if (!app.type_of_invention) return 'Unknown';
		if (Array.isArray(app.type_of_invention)) return app.type_of_invention[0]?.name || 'Unknown';
		return app.type_of_invention.name || 'Unknown';
	}

	async function buildMonthlyPdf(): Promise<void> {
		const {
			currentApplications,
			prevApplications,
			currentPayments,
			prevPayments,
			companySettings,
			periodLabel,
			generatedAt
		} = data;

		const totalFilings = currentApplications.length;
		const prevFilings = prevApplications.length;
		const totalRevenue = currentPayments.reduce(
			(s: number, p: { amount: number | string }) => s + Number(p.amount ?? 0),
			0
		);
		const prevRevenueVal = prevPayments.reduce(
			(s: number, p: { amount: number | string }) => s + Number(p.amount ?? 0),
			0
		);
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
		builder.addHeader({
			companyName: companySettings.company_name,
			subtitle: 'Monthly Filing Report',
			periodLabel,
			generatedAt,
			logoBase64: DMV_LOGO_BASE64
		});

		builder.addSummaryCards([
			{
				label: 'Total Filings',
				value: String(totalFilings),
				subtitle: `${pctChange(totalFilings, prevFilings)} vs prev month`
			},
			{
				label: 'Total Revenue',
				value: formatPdfCompact(totalRevenue),
				subtitle: `${pctChange(totalRevenue, prevRevenueVal)} vs prev month`
			},
			{
				label: 'Avg Revenue/Filing',
				value: formatPdfCurrency(avgRevenue),
				subtitle: 'Per application'
			}
		]);

		// Narrative Analysis: Filing Breakdown by IP Type
		builder.addSectionTitle('Filing Analysis');
		if (totalFilings > 0) {
			const topType = [...entries].sort((a, b) => b.count - a.count)[0];
			const breakdownText = entries
				.map(
					(e) =>
						`${e.name} (${e.count} filing${e.count !== 1 ? 's' : ''}, ${(totalFilings > 0 ? (e.count / totalFilings) * 100 : 0).toFixed(1)}%)`
				)
				.join(', ');

			builder.addText(
				`During the period of ${periodLabel}, a total of ${totalFilings} applications were filed. This represents a ${pctChange(totalFilings, prevFilings)} change compared to the previous month's total of ${prevFilings} filings. The applications were distributed across the following intellectual property types: ${breakdownText}.`
			);
			if (topType) {
				builder.addText(
					`The leading category for this period was ${topType.name}, accounting for ${topType.count} filings, or ${(totalFilings > 0 ? (topType.count / totalFilings) * 100 : 0).toFixed(1)}% of the total volume.`
				);
			}
		} else {
			builder.addText('No filing activity was recorded during this period.');
		}
		builder.addSpacing(4);

		// Narrative Analysis: Revenue Distribution
		builder.addSectionTitle('Revenue Analysis');
		if (totalRevenue > 0) {
			const sortedEntriesByRev = [...entries].sort((a, b) => b.revenue - a.revenue);
			const topRevType = sortedEntriesByRev[0];
			const revenueBreakdownText = entries
				.map(
					(e) =>
						`${e.name} (${formatPdfCurrency(e.revenue)}, ${(totalRevenue > 0 ? (e.revenue / totalRevenue) * 100 : 0).toFixed(1)}%)`
				)
				.join(', ');

			builder.addText(
				`Total revenue generated for this period was ${formatPdfCurrency(totalRevenue)}, which is a ${pctChange(totalRevenue, prevRevenueVal)} change compared to ${formatPdfCurrency(prevRevenueVal)} in the previous month. The average revenue generated per filing was ${formatPdfCurrency(avgRevenue)}.`
			);
			builder.addText(
				`The estimated distribution of revenue by IP type, allocated proportionally based on filing volumes, is as follows: ${revenueBreakdownText}.`
			);
			if (topRevType && topRevType.revenue > 0) {
				builder.addText(
					`The primary source of revenue is estimated to be ${topRevType.name}, contributing ${formatPdfCurrency(topRevType.revenue)} (${(totalRevenue > 0 ? (topRevType.revenue / totalRevenue) * 100 : 0).toFixed(1)}% of the total).`
				);
			}
		} else {
			builder.addText(
				`Total revenue generated for this period was ${formatPdfCurrency(0)}, representing no financial transactions during the selected period.`
			);
		}
		builder.addSpacing(4);

		// Narrative Analysis: 6-Month Filing Trend
		builder.addSectionTitle('Historical Trend Analysis');
		const trendList = data.trendData;
		if (trendList && trendList.length > 0) {
			const counts = trendList.map((t: { count: number }) => t.count);
			const totalTrendCount = counts.reduce((sum: number, c: number) => sum + c, 0);
			const avgTrendCount = totalTrendCount / trendList.length;
			const maxVal = Math.max(...counts);
			const minVal = Math.min(...counts);

			const maxMonths = trendList
				.filter((t: { count: number }) => t.count === maxVal)
				.map((t: { month: string }) => t.month)
				.join(', ');
			const minMonths = trendList
				.filter((t: { count: number }) => t.count === minVal)
				.map((t: { month: string }) => t.month)
				.join(', ');

			const chronologicalTrend = trendList
				.map(
					(t: { month: string; count: number }) =>
						`${t.month}: ${t.count} filing${t.count !== 1 ? 's' : ''}`
				)
				.join(', ');

			builder.addText(
				`An analysis of the six-month filing history provides a broader context for the current period's activity. Over this timeframe, system activity logged a total of ${totalTrendCount} filings, representing a monthly average of ${avgTrendCount.toFixed(1)} filings.`
			);
			builder.addText(
				`Filing volume fluctuated from a minimum of ${minVal} in ${minMonths} to a maximum of ${maxVal} in ${maxMonths}. The recorded monthly filings were: ${chronologicalTrend}.`
			);
		} else {
			builder.addText('Insufficient historical data is available to generate a trend analysis.');
		}
		builder.addSpacing(4);

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
					revenue: formatPdfCurrency(e.revenue),
					avg: formatPdfCurrency(e.count > 0 ? e.revenue / e.count : 0),
					pct: totalFilings > 0 ? `${((e.count / totalFilings) * 100).toFixed(1)}%` : '0.0%'
				})),
				{
					name: 'Total',
					count: String(totalFilings),
					revenue: formatPdfCurrency(totalRevenue),
					avg: formatPdfCurrency(avgRevenue),
					pct: '100%'
				}
			]
		});

		// Highlights
		const highlights: PdfHighlight[] = [];
		if (totalFilings > prevFilings)
			highlights.push({
				text: `Filings increased by ${pctChange(totalFilings, prevFilings)} compared to previous month`,
				type: 'positive'
			});
		else if (totalFilings < prevFilings)
			highlights.push({
				text: `Filings decreased by ${pctChange(totalFilings, prevFilings)} compared to previous month`,
				type: 'negative'
			});
		if (totalRevenue > prevRevenueVal)
			highlights.push({
				text: `Overall revenue grew by ${pctChange(totalRevenue, prevRevenueVal)}`,
				type: 'positive'
			});
		else if (totalRevenue < prevRevenueVal)
			highlights.push({
				text: `Revenue declined by ${pctChange(totalRevenue, prevRevenueVal)} vs previous month`,
				type: 'negative'
			});
		const topType = entries.sort((a, b) => b.count - a.count)[0];
		if (topType)
			highlights.push({
				text: `${topType.name} applications lead with ${topType.count} filings this period`,
				type: 'neutral'
			});
		if (highlights.length === 0)
			highlights.push({ text: 'No significant changes detected this period', type: 'neutral' });
		builder.addHighlights(highlights);

		builder.addFooter({
			companyName: companySettings.company_name,
			contactInfo: companySettings.contact_info,
			registeredAddress: companySettings.registered_address
		});
		await builder.save(pdfFilename);
	}

	// ── Build PDF for Client Statistics Report ──────────────────────

	async function buildClientPdf(): Promise<void> {
		const { clients, clientFilings, companySettings, periodLabel, generatedAt } = data;

		const totalClients = clients.length;
		const individualClients = clients.filter(
			(c: { is_individual: boolean }) => c.is_individual
		).length;
		const companyClients = totalClients - individualClients;
		const totalFilingsCount = clientFilings.length;

		const builder = new PdfReportBuilder();
		builder.addHeader({
			companyName: companySettings.company_name,
			subtitle: 'Client Statistics Report',
			periodLabel,
			generatedAt,
			logoBase64: DMV_LOGO_BASE64
		});

		builder.addSummaryCards([
			{ label: 'Total Clients', value: String(totalClients), subtitle: 'All registered clients' },
			{
				label: 'Individual Clients',
				value: String(individualClients),
				subtitle:
					totalClients > 0
						? `${((individualClients / totalClients) * 100).toFixed(0)}% of total`
						: '0%'
			},
			{
				label: 'Company Clients',
				value: String(companyClients),
				subtitle:
					totalClients > 0
						? `${((companyClients / totalClients) * 100).toFixed(0)}% of total`
						: '0%'
			}
		]);

		// Narrative Analysis: Client Type Distribution
		builder.addSectionTitle('Client Type Distribution Analysis');
		if (totalClients > 0) {
			const indPct = ((individualClients / totalClients) * 100).toFixed(1);
			const compPct = ((companyClients / totalClients) * 100).toFixed(1);
			const compositionDesc =
				individualClients > companyClients
					? 'predominantly individual-based'
					: individualClients < companyClients
						? 'predominantly corporate-based'
						: 'balanced between individual and corporate clients';

			builder.addText(
				`As of the selected period, the client database has a total of ${totalClients} registered clients. This client base is comprised of ${individualClients} individual clients (${indPct}%) and ${companyClients} company clients (${compPct}%).`
			);
			builder.addText(
				`This distribution indicates that the firm's client portfolio is ${compositionDesc}, which influences the types of intellectual property filings and the corresponding service engagements.`
			);
		} else {
			builder.addText('No client data is currently registered in the database for analysis.');
		}
		builder.addSpacing(4);

		// Nationality ranking
		const natCounts: Record<string, number> = {};
		for (const c of clients) {
			const nat = (c as { nationality?: string | null }).nationality?.trim() || 'Not Specified';
			natCounts[nat] = (natCounts[nat] ?? 0) + 1;
		}
		const natRanking = Object.entries(natCounts)
			.map(([n, count]) => ({ nationality: n, count }))
			.sort((a, b) => b.count - a.count);

		// Narrative Analysis: Nationality Ranking
		builder.addSectionTitle('Nationality Distribution Analysis');
		if (totalClients > 0 && natRanking.length > 0) {
			const topNat = natRanking[0];
			const topNatPct = ((topNat.count / totalClients) * 100).toFixed(1);
			const rankingText = natRanking
				.slice(0, 3)
				.map(
					(n) =>
						`${n.nationality} (${n.count} client${n.count !== 1 ? 's' : ''}, ${((n.count / totalClients) * 100).toFixed(1)}%)`
				)
				.join(', ');

			builder.addText(
				`The geographical and national diversity of the client base is represented across various registered nationalities. The top nationalities of registered clients include: ${rankingText}.`
			);
			builder.addText(
				`Clients holding ${topNat.nationality} nationality represent the largest segment, accounting for ${topNat.count} registered client profiles, or ${topNatPct}% of the overall client base.`
			);
		} else {
			builder.addText('No nationality information is available for registered clients.');
		}
		builder.addSpacing(4);

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
		type ClientProfile = {
			client_id: string;
			first_name: string;
			last_name: string;
			is_individual: boolean;
			company_name?: string | null;
		};
		const filingCounts: Record<string, { name: string; type: string; count: number }> = {};
		for (const f of clientFilings) {
			const raw = (f as unknown as { client_profiles?: ClientProfile | ClientProfile[] | null })
				.client_profiles;
			const cp = Array.isArray(raw) ? (raw[0] ?? null) : (raw ?? null);
			if (!cp) continue;
			if (!filingCounts[cp.client_id]) {
				const name =
					!cp.is_individual && cp.company_name
						? cp.company_name
						: [cp.first_name, cp.last_name].filter(Boolean).join(' ');
				filingCounts[cp.client_id] = {
					name,
					type: cp.is_individual ? 'Individual' : 'Company',
					count: 0
				};
			}
			filingCounts[cp.client_id].count += 1;
		}
		const topClients = Object.values(filingCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Narrative Analysis: Client Filing Ranking
		builder.addSectionTitle('Client Filing Ranking Analysis');
		if (totalFilingsCount > 0 && topClients.length > 0) {
			const topClient = topClients[0];
			const topClientPct = ((topClient.count / totalFilingsCount) * 100).toFixed(1);
			const topThreeText = topClients
				.slice(0, 3)
				.map(
					(c) =>
						`${c.name} (${c.count} filing${c.count !== 1 ? 's' : ''}, ${((c.count / totalFilingsCount) * 100).toFixed(1)}%)`
				)
				.join(', ');

			builder.addText(
				`An analysis of filing activity per client shows that ${topClient.name} is the most active client during this period, leading with ${topClient.count} filings, representing ${topClientPct}% of all applications. The top contributors are: ${topThreeText}.`
			);
			builder.addText(
				`These primary contributors account for a significant portion of the total volume, demonstrating their pivotal role in the firm's overall intellectual property filing pipeline.`
			);
		} else {
			builder.addText('No client filing activity was recorded during this period.');
		}
		builder.addSpacing(4);

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
		if (totalClients > 0)
			highlights.push({
				text: `Individual clients make up ${((individualClients / totalClients) * 100).toFixed(0)}% of the total client base`,
				type: 'neutral'
			});
		const topNat = natRanking[0];
		if (topNat && totalClients > 0)
			highlights.push({
				text: `${topNat.nationality} nationals account for ${((topNat.count / totalClients) * 100).toFixed(0)}% of all clients`,
				type: 'neutral'
			});
		const topClient = topClients[0];
		if (topClient)
			highlights.push({
				text: `${topClient.name} leads with ${topClient.count} total filings`,
				type: 'positive'
			});
		if (highlights.length === 0)
			highlights.push({ text: 'No client data available for analysis', type: 'neutral' });
		builder.addHighlights(highlights);

		builder.addFooter({
			companyName: companySettings.company_name,
			contactInfo: companySettings.contact_info,
			registeredAddress: companySettings.registered_address
		});
		await builder.save(pdfFilename);
	}

	// ── Build PDF for Data Integrity Report ─────────────────────────

	async function buildIntegrityPdf(): Promise<void> {
		const { auditLogs, companySettings, periodLabel, generatedAt } = data;

		const SEVERITY_LABELS: Record<string, string> = {
			danger: 'Danger',
			warning: 'Warning',
			notice: 'Notice',
			neutral: 'Neutral'
		};

		const totalEvents = auditLogs.length;
		const dangerEvents = auditLogs.filter(
			(l: { severity_level: string }) => l.severity_level === 'danger'
		).length;
		const warningEvents = auditLogs.filter(
			(l: { severity_level: string }) => l.severity_level === 'warning'
		).length;
		const uniqueUsers = new Set(
			auditLogs
				.filter((l: { actor_id: string | null }) => l.actor_id)
				.map((l: { actor_id: string | null }) => l.actor_id)
		).size;

		const builder = new PdfReportBuilder();
		builder.addHeader({
			companyName: companySettings.company_name,
			subtitle: 'Data Integrity & Security Report',
			periodLabel,
			generatedAt,
			logoBase64: DMV_LOGO_BASE64
		});

		builder.addSummaryCards([
			{ label: 'Total Audit Events', value: String(totalEvents), subtitle: 'In selected period' },
			{
				label: 'Danger Events',
				value: String(dangerEvents),
				subtitle:
					totalEvents > 0
						? `${((dangerEvents / totalEvents) * 100).toFixed(1)}% of total`
						: 'No events'
			},
			{
				label: 'Warning Events',
				value: String(warningEvents),
				subtitle:
					totalEvents > 0
						? `${((warningEvents / totalEvents) * 100).toFixed(1)}% of total`
						: 'No events'
			},
			{ label: 'Active Users', value: String(uniqueUsers), subtitle: 'Users with logged activity' }
		]);

		// Narrative Analysis: Severity Distribution
		builder.addSectionTitle('Security Severity Analysis');
		if (totalEvents > 0) {
			const dangerPct = ((dangerEvents / totalEvents) * 100).toFixed(1);
			const warningPct = ((warningEvents / totalEvents) * 100).toFixed(1);
			const noticeEvents = auditLogs.filter(
				(l: { severity_level: string }) => l.severity_level === 'notice'
			).length;
			const neutralEvents = auditLogs.filter(
				(l: { severity_level: string }) => l.severity_level === 'neutral' || !l.severity_level
			).length;

			builder.addText(
				`During the audit period, a total of ${totalEvents} security and system events were logged. The severity breakdown shows ${dangerEvents} danger-level events (${dangerPct}%) and ${warningEvents} warning-level events (${warningPct}%), with the remaining events classified as Notice (${noticeEvents}) or Neutral (${neutralEvents}).`
			);

			if (dangerEvents > 0) {
				builder.addText(
					`WARNING: The detection of ${dangerEvents} danger-level events indicates potential security vulnerabilities or critical system actions that require immediate administrator attention and review.`
				);
			} else {
				builder.addText(
					`The absence of danger-level events indicates a secure and stable operational state, with zero critical system threats logged during this timeframe.`
				);
			}
		} else {
			builder.addText('No audit log entries were recorded in the selected period.');
		}
		builder.addSpacing(4);

		// Event type table
		const evtCounts: Record<string, number> = {};
		for (const log of auditLogs) {
			const evt = (log as { event_type: string }).event_type || 'Unknown';
			evtCounts[evt] = (evtCounts[evt] ?? 0) + 1;
		}
		const evtBreakdown = Object.entries(evtCounts)
			.map(([event, count]) => ({ event, count }))
			.sort((a, b) => b.count - a.count);

		// Narrative Analysis: Event Types
		builder.addSectionTitle('System Activity & Operations');
		if (totalEvents > 0 && evtBreakdown.length > 0) {
			const topEvt = evtBreakdown[0];
			const topEvtPct = ((topEvt.count / totalEvents) * 100).toFixed(1);
			const eventListText = evtBreakdown
				.slice(0, 3)
				.map(
					(e) =>
						`"${e.event}" (${e.count} event${e.count !== 1 ? 's' : ''}, ${((e.count / totalEvents) * 100).toFixed(1)}%)`
				)
				.join(', ');

			builder.addText(
				`System event logging captured various categories of administrative and user actions. The most frequent operation types recorded were: ${eventListText}.`
			);
			builder.addText(
				`Operations categorized under "${topEvt.event}" were the most prominent, accounting for ${topEvt.count} logs, or ${topEvtPct}% of the overall audit trail volume.`
			);
		} else {
			builder.addText('No specific event type statistics could be generated.');
		}
		builder.addSpacing(4);

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
		type AuditProfile = {
			first_name: string | null;
			last_name: string | null;
			role: string | null;
		};
		const userCounts: Record<string, { name: string; role: string; count: number }> = {};
		for (const log of auditLogs) {
			const l = log as {
				actor_id: string | null;
				user_profiles?: AuditProfile | AuditProfile[] | null;
			};
			if (!l.actor_id) continue;
			const profile = Array.isArray(l.user_profiles) ? l.user_profiles[0] : l.user_profiles;
			const name = profile
				? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User'
				: 'Unknown User';
			const role = profile?.role ?? 'N/A';
			if (!userCounts[l.actor_id]) userCounts[l.actor_id] = { name, role, count: 0 };
			userCounts[l.actor_id].count += 1;
		}
		const topUsers = Object.values(userCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, 10);

		// Narrative Analysis: 6-Month Audit Trail Trend
		builder.addSectionTitle('Audit Trail Trend Analysis');
		const trendList = data.auditTrendData;
		if (trendList && trendList.length > 0) {
			const counts = trendList.map((t: { count: number }) => t.count);
			const totalTrendCount = counts.reduce((sum: number, c: number) => sum + c, 0);
			const avgTrendCount = totalTrendCount / trendList.length;
			const maxVal = Math.max(...counts);
			const minVal = Math.min(...counts);

			const maxMonths = trendList
				.filter((t: { count: number }) => t.count === maxVal)
				.map((t: { month: string }) => t.month)
				.join(', ');
			const minMonths = trendList
				.filter((t: { count: number }) => t.count === minVal)
				.map((t: { month: string }) => t.month)
				.join(', ');

			const chronologicalTrend = trendList
				.map(
					(t: { month: string; count: number }) =>
						`${t.month}: ${t.count} event${t.count !== 1 ? 's' : ''}`
				)
				.join(', ');

			builder.addText(
				`Monitoring the volume of system logs over a six-month window provides baseline data for normal operations. Over this duration, the system registered a total of ${totalTrendCount} audit events, establishing a monthly average of ${avgTrendCount.toFixed(1)} operations.`
			);
			builder.addText(
				`Activity fluctuated between a low of ${minVal} events in ${minMonths} and a peak of ${maxVal} events in ${maxMonths}. The chronological monthly counts are: ${chronologicalTrend}.`
			);
		} else {
			builder.addText('Insufficient historical audit log trend data available.');
		}
		builder.addSpacing(4);

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
		const secEvents = auditLogs
			.filter(
				(l: { severity_level: string }) =>
					l.severity_level === 'danger' || l.severity_level === 'warning'
			)
			.slice(0, 10);
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
				rows: secEvents.map(
					(e: {
						timestamp: string;
						severity_level: string;
						event_type: string;
						details: string;
						ip_address: string | null;
					}) => ({
						time: new Date(e.timestamp).toLocaleString('en-US', {
							month: 'short',
							day: 'numeric',
							hour: 'numeric',
							minute: '2-digit',
							hour12: true
						}),
						severity: SEVERITY_LABELS[e.severity_level] ?? e.severity_level,
						event: e.event_type,
						details: e.details,
						ip: e.ip_address ?? 'N/A'
					})
				)
			});
		}

		// Highlights
		const highlights: PdfHighlight[] = [];
		if (dangerEvents > 0)
			highlights.push({
				text: `${dangerEvents} danger-level event${dangerEvents !== 1 ? 's' : ''} detected — review recommended`,
				type: 'negative'
			});
		else
			highlights.push({
				text: 'No danger-level security events recorded in this period',
				type: 'positive'
			});
		if (warningEvents > 0)
			highlights.push({
				text: `${warningEvents} warning-level event${warningEvents !== 1 ? 's' : ''} logged — monitor for patterns`,
				type: 'neutral'
			});
		if (uniqueUsers > 0)
			highlights.push({
				text: `${uniqueUsers} unique user${uniqueUsers !== 1 ? 's' : ''} generated audit trail entries`,
				type: 'neutral'
			});
		const topEvt = evtBreakdown[0];
		if (topEvt && totalEvents > 0)
			highlights.push({
				text: `"${topEvt.event}" is the most frequent event type at ${((topEvt.count / totalEvents) * 100).toFixed(0)}% of total`,
				type: 'neutral'
			});
		builder.addHighlights(highlights);

		builder.addFooter({
			companyName: companySettings.company_name,
			contactInfo: companySettings.contact_info,
			registeredAddress: companySettings.registered_address
		});
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
