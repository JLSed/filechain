<script lang="ts">
	import ReportHeader from './ReportHeader.svelte';
	import ReportFooter from './ReportFooter.svelte';
	import { Users, User, Building2, Globe, Trophy } from '@lucide/svelte';
	import { PieChart, Arc, Text, BarChart } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import * as Chart from '$lib/shadcn/components/ui/chart/index.js';

	interface Client {
		client_id: string;
		first_name: string;
		middle_name?: string | null;
		last_name: string;
		is_individual: boolean;
		nationality?: string | null;
		company_name?: string | null;
		company_address?: string | null;
		email?: string | null;
		created_at?: string;
	}

	interface ClientProfile {
		client_id: string;
		first_name: string;
		last_name: string;
		is_individual: boolean;
		company_name?: string | null;
		nationality?: string | null;
	}

	interface ClientFiling {
		application_id: string;
		client_id?: string | null;
		client_profiles?: ClientProfile | ClientProfile[] | null;
	}

	function getFilingClientProfile(f: ClientFiling): ClientProfile | null {
		if (!f.client_profiles) return null;
		if (Array.isArray(f.client_profiles)) return f.client_profiles[0] ?? null;
		return f.client_profiles;
	}

	interface CompanySettings {
		company_name: string;
		contact_info: string;
		registered_address: string;
	}

	interface ClientStatisticsReportProps {
		clients: Client[];
		clientFilings: ClientFiling[];
		companySettings: CompanySettings;
		periodLabel: string;
		generatedAt: string;
	}

	let {
		clients,
		clientFilings,
		companySettings,
		periodLabel,
		generatedAt
	}: ClientStatisticsReportProps = $props();

	const CHART_COLORS = [
		'hsl(217, 91%, 60%)',
		'hsl(142, 71%, 45%)',
		'hsl(47, 96%, 53%)',
		'hsl(262, 83%, 58%)',
		'hsl(12, 76%, 61%)',
		'hsl(195, 74%, 50%)',
		'hsl(330, 70%, 55%)',
		'hsl(170, 65%, 45%)'
	];

	function getClientDisplayName(client: {
		first_name: string;
		last_name: string;
		is_individual: boolean;
		company_name?: string | null;
	}): string {
		if (!client.is_individual && client.company_name) return client.company_name;
		return [client.first_name, client.last_name].filter(Boolean).join(' ');
	}

	// === Executive summary ===
	const totalClients = $derived(clients.length);
	const individualClients = $derived(clients.filter((c) => c.is_individual).length);
	const companyClients = $derived(clients.filter((c) => !c.is_individual).length);

	// === Client type distribution (pie chart) ===
	const clientTypePieData = $derived([
		{ type: 'Individual', count: individualClients, color: CHART_COLORS[0] },
		{ type: 'Company', count: companyClients, color: CHART_COLORS[1] }
	]);

	const clientTypePieConfig = {
		count: { label: 'Clients' },
		Individual: { label: 'Individual', color: CHART_COLORS[0] },
		Company: { label: 'Company', color: CHART_COLORS[1] }
	} satisfies Chart.ChartConfig;

	// === Nationality ranking ===
	const nationalityRanking = $derived(() => {
		const counts: Record<string, number> = {};
		for (const c of clients) {
			const nat = c.nationality?.trim() || 'Not Specified';
			counts[nat] = (counts[nat] ?? 0) + 1;
		}
		return Object.entries(counts)
			.map(([nationality, count]) => ({ nationality, count }))
			.sort((a, b) => b.count - a.count);
	});

	const nationalityBarData = $derived(
		nationalityRanking()
			.slice(0, 8)
			.map((n, i) => ({
				label: n.nationality,
				count: n.count,
				color: CHART_COLORS[i % CHART_COLORS.length]
			}))
	);

	const nationalityBarConfig = $derived(() => {
		const cfg: Record<string, { label: string; color: string }> = {};
		for (const n of nationalityBarData) {
			cfg[n.label] = { label: n.label, color: n.color };
		}
		return { count: { label: 'Clients' }, ...cfg } satisfies Chart.ChartConfig;
	});

	// === Top clients by filing count ===
	const topClientsByFiling = $derived(() => {
		const counts: Record<string, { name: string; type: string; count: number }> = {};
		for (const f of clientFilings) {
			const cp = getFilingClientProfile(f);
			if (!cp) continue;
			if (!counts[cp.client_id]) {
				counts[cp.client_id] = {
					name: getClientDisplayName(cp),
					type: cp.is_individual ? 'Individual' : 'Company',
					count: 0
				};
			}
			counts[cp.client_id].count += 1;
		}
		return Object.values(counts).sort((a, b) => b.count - a.count);
	});

	const totalFilings = $derived(clientFilings.length);

	// === Auto-generate highlights ===
	const highlights = $derived(() => {
		const items: { text: string; type: 'positive' | 'neutral' | 'negative' }[] = [];

		if (totalClients > 0) {
			const indPct = ((individualClients / totalClients) * 100).toFixed(0);
			items.push({
				text: `Individual clients make up ${indPct}% of the total client base`,
				type: 'neutral'
			});
		}

		const topNat = nationalityRanking()[0];
		if (topNat && totalClients > 0) {
			const pct = ((topNat.count / totalClients) * 100).toFixed(0);
			items.push({
				text: `${topNat.nationality} nationals account for ${pct}% of all clients`,
				type: 'neutral'
			});
		}

		const topClient = topClientsByFiling()[0];
		if (topClient) {
			items.push({
				text: `${topClient.name} leads with ${topClient.count} total filings`,
				type: 'positive'
			});
		}

		if (companyClients > 0 && individualClients > 0 && totalFilings > 0) {
			const compFilings = clientFilings.filter((f) => {
				const cp = getFilingClientProfile(f);
				return cp && !cp.is_individual;
			}).length;
			const individualFilingsCount = totalFilings - compFilings;
			if (individualClients > 0 && companyClients > 0) {
				const avgCompany = compFilings / companyClients;
				const avgIndividual = individualFilingsCount / individualClients;
				if (avgIndividual > 0) {
					const ratio = (avgCompany / avgIndividual).toFixed(1);
					items.push({
						text: `Company clients file ${ratio}x more applications on average`,
						type: 'neutral'
					});
				}
			}
		}

		if (items.length === 0) {
			items.push({ text: 'No client data available for analysis', type: 'neutral' });
		}

		return items;
	});
</script>

<div id="client-statistics-report" class="space-y-6 rounded-lg border bg-background p-6 shadow-sm">
	<!-- Header -->
	<ReportHeader
		companyName={companySettings.company_name}
		subtitle="Client Statistics Report"
		{periodLabel}
		{generatedAt}
	/>

	<!-- Executive Summary -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Executive Summary</h3>
		<div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
			<div class="rounded-lg border-l-4 border-l-blue-500 bg-blue-50 p-4 dark:bg-blue-950/30">
				<div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
					<Users class="size-3.5!" />
					Total Clients
				</div>
				<p class="mt-1 text-2xl font-bold text-blue-700 dark:text-blue-300">{totalClients}</p>
				<p class="mt-1 text-xs text-muted-foreground">All registered clients</p>
			</div>

			<div
				class="rounded-lg border-l-4 border-l-emerald-500 bg-emerald-50 p-4 dark:bg-emerald-950/30"
			>
				<div class="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400">
					<User class="size-3.5!" />
					Individual Clients
				</div>
				<p class="mt-1 text-2xl font-bold text-emerald-700 dark:text-emerald-300">
					{individualClients}
				</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{totalClients > 0 ? ((individualClients / totalClients) * 100).toFixed(0) : 0}% of total
				</p>
			</div>

			<div class="rounded-lg border-l-4 border-l-violet-500 bg-violet-50 p-4 dark:bg-violet-950/30">
				<div class="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-400">
					<Building2 class="size-3.5!" />
					Company Clients
				</div>
				<p class="mt-1 text-2xl font-bold text-violet-700 dark:text-violet-300">{companyClients}</p>
				<p class="mt-1 text-xs text-muted-foreground">
					{totalClients > 0 ? ((companyClients / totalClients) * 100).toFixed(0) : 0}% of total
				</p>
			</div>
		</div>
	</div>

	<!-- Client Type Distribution -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Client Type Distribution</h3>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<div class="rounded-lg border p-4">
				{#if totalClients > 0}
					<div class="h-[220px]">
						<Chart.Container
							config={clientTypePieConfig}
							class="mx-auto aspect-square! max-h-[220px] overflow-hidden!"
						>
							<PieChart
								data={clientTypePieData}
								key="type"
								value="count"
								cRange={clientTypePieData.map((d) => d.color)}
								c="color"
								props={{ pie: { motion: 'tween' } }}
							>
								{#snippet tooltip()}
									<Chart.Tooltip hideLabel />
								{/snippet}
								{#snippet arc({ props: arcProps, visibleData, index })}
									{@const typeName = visibleData[index].type}
									<Arc {...arcProps}>
										{#snippet children({ getArcTextProps })}
											<Text
												value={typeName}
												{...getArcTextProps('centroid')}
												font-size="12"
												class="fill-background"
											/>
										{/snippet}
									</Arc>
								{/snippet}
							</PieChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[220px] items-center justify-center text-sm text-muted-foreground">
						No client data available
					</div>
				{/if}
			</div>

			<!-- Summary table alongside -->
			<div class="flex flex-col justify-center space-y-3 rounded-lg border p-4">
				{#each clientTypePieData as entry (entry.type)}
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<span class="size-3 rounded-full" style="background-color: {entry.color}"></span>
							<span class="text-sm font-medium">{entry.type}</span>
						</div>
						<div class="text-right">
							<span class="text-sm font-bold">{entry.count}</span>
							<span class="ml-2 text-xs text-muted-foreground">
								({totalClients > 0 ? ((entry.count / totalClients) * 100).toFixed(1) : '0.0'}%)
							</span>
						</div>
					</div>
				{/each}
				<div class="border-t pt-2">
					<div class="flex items-center justify-between font-semibold">
						<span class="text-sm">Total</span>
						<span class="text-sm">{totalClients}</span>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Nationality Ranking -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Nationality Ranking</h3>
		<div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
			<!-- Bar Chart -->
			<div class="rounded-lg border p-4">
				<p class="mb-2 text-sm font-medium text-muted-foreground">Top Nationalities</p>
				{#if nationalityBarData.length > 0}
					<div class="h-[200px]">
						<Chart.Container
							config={nationalityBarConfig()}
							class="aspect-auto! h-full! overflow-hidden!"
						>
							<BarChart
								data={nationalityBarData}
								orientation="horizontal"
								yScale={scaleBand().padding(0.25)}
								y="label"
								axis="y"
								rule={false}
								series={[{ key: 'count', label: 'Clients', color: CHART_COLORS[0] }]}
								padding={{ right: 16 }}
								props={{
									bars: { stroke: 'none', radius: 5, rounded: 'all' },
									highlight: { area: { fill: 'none' } },
									yAxis: {
										tickLabelProps: {
											textAnchor: 'start',
											dx: 6,
											class: 'stroke-none fill-background!'
										},
										tickLength: 0
									}
								}}
							>
								{#snippet tooltip()}
									<Chart.Tooltip hideLabel />
								{/snippet}
							</BarChart>
						</Chart.Container>
					</div>
				{:else}
					<div class="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
						No nationality data available
					</div>
				{/if}
			</div>

			<!-- Table -->
			<div class="overflow-x-auto rounded-lg border">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b bg-muted/50">
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Rank</th>
							<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Nationality</th>
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Clients</th>
							<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">%</th>
						</tr>
					</thead>
					<tbody>
						{#each nationalityRanking() as nat, i (nat.nationality)}
							<tr class="border-b">
								<td class="px-4 py-2 text-muted-foreground">{i + 1}</td>
								<td class="px-4 py-2 font-medium">
									<div class="flex items-center gap-2">
										<Globe class="size-3.5! text-muted-foreground" />
										{nat.nationality}
									</div>
								</td>
								<td class="px-4 py-2 text-right tabular-nums">{nat.count}</td>
								<td class="px-4 py-2 text-right tabular-nums">
									{totalClients > 0 ? ((nat.count / totalClients) * 100).toFixed(1) : '0.0'}%
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</div>

	<!-- Client Filing Ranking -->
	<div>
		<h3 class="mb-3 text-base font-semibold text-foreground">Client Filing Ranking</h3>
		<div class="overflow-x-auto rounded-lg border">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Rank</th>
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Client Name</th>
						<th class="px-4 py-2.5 text-left font-medium text-muted-foreground">Type</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">Filings</th>
						<th class="px-4 py-2.5 text-right font-medium text-muted-foreground">% of Total</th>
					</tr>
				</thead>
				<tbody>
					{#each topClientsByFiling().slice(0, 10) as client, i (client.name)}
						<tr class="border-b">
							<td class="px-4 py-2 text-muted-foreground">
								<div class="flex items-center gap-1.5">
									{#if i < 3}
										<Trophy
											class="size-3.5! {i === 0
												? 'text-amber-500'
												: i === 1
													? 'text-gray-400'
													: 'text-amber-700'}"
										/>
									{/if}
									{i + 1}
								</div>
							</td>
							<td class="px-4 py-2 font-medium">{client.name}</td>
							<td class="px-4 py-2">
								<span
									class="inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium {client.type ===
									'Individual'
										? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
										: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'}"
								>
									{client.type}
								</span>
							</td>
							<td class="px-4 py-2 text-right font-semibold tabular-nums">{client.count}</td>
							<td class="px-4 py-2 text-right tabular-nums">
								{totalFilings > 0 ? ((client.count / totalFilings) * 100).toFixed(1) : '0.0'}%
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<!-- Footer -->
	<ReportFooter
		highlights={highlights()}
		companyName={companySettings.company_name}
		contactInfo={companySettings.contact_info}
		registeredAddress={companySettings.registered_address}
	/>
</div>
