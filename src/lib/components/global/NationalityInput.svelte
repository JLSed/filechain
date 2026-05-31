<script lang="ts">
	import nationalityData from '$lib/constants/nationality.json';

	interface Nationality {
		country: string;
		nationality: string;
		alpha2: string;
	}

	const nationalities: Nationality[] = nationalityData as Nationality[];

	let {
		value = $bindable(''),
		required = false,
		disabled = false
	}: {
		value: string;
		required?: boolean;
		disabled?: boolean;
	} = $props();

	let open = $state(false);
	let searchQuery = $state('');
	let flagFailed = $state(false);

	const activeNationality = $derived(
		nationalities.find(
			(n) =>
				n.nationality.toLowerCase() === value.toLowerCase() ||
				n.country.toLowerCase() === value.toLowerCase()
		)
	);

	const filteredNationalities = $derived(
		nationalities.filter(
			(n) =>
				n.nationality.toLowerCase().includes(searchQuery.toLowerCase()) ||
				n.country.toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	function selectNationality(n: Nationality) {
		value = n.nationality;
		open = false;
		searchQuery = '';
	}

	function handleDropdownKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function handleTriggerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			if (!disabled) open = !open;
		}
	}
</script>

<div class="relative w-full">
	<!-- Trigger button -->
	<button
		type="button"
		class="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		onclick={() => {
			if (!disabled) open = !open;
		}}
		onkeydown={handleTriggerKeydown}
		aria-haspopup="listbox"
		aria-expanded={open}
		{disabled}
	>
		<div class="flex items-center gap-2 truncate">
			{#if activeNationality}
				{#if !flagFailed}
					<img
						src="https://flagcdn.com/w20/{activeNationality.alpha2.toLowerCase()}.png"
						width="20"
						height="15"
						alt={activeNationality.alpha2}
						class="object-cover"
						onerror={() => (flagFailed = true)}
					/>
				{:else}
					<span class="text-xs font-semibold text-muted-foreground">{activeNationality.alpha2}</span
					>
				{/if}
				<span class="truncate">{activeNationality.nationality}</span>
			{:else}
				<span class="text-muted-foreground">{value || 'Select nationality...'}</span>
			{/if}
		</div>
		<svg
			class="size-4 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-180' : ''}"
			xmlns="http://www.w3.org/2000/svg"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			stroke-width="2"
			stroke-linecap="round"
			stroke-linejoin="round"
		>
			<path d="m6 9 6 6 6-6" />
		</svg>
	</button>

	<!-- Hidden input for form validation -->
	<input type="hidden" {required} {value} />

	<!-- Dropdown list -->
	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute left-0 z-50 mt-1 w-full rounded-md border border-border bg-popover shadow-md"
			style="bottom: auto; top: 100%; max-height: 320px; display: flex; flex-direction: column;"
			onkeydown={handleDropdownKeydown}
		>
			<!-- Search -->
			<div class="shrink-0 border-b border-border p-2">
				<input
					type="text"
					placeholder="Search nationality..."
					class="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
					bind:value={searchQuery}
				/>
			</div>

			<!-- List options -->
			<ul
				class="overflow-y-auto py-1"
				style="max-height: 240px;"
				role="listbox"
				aria-label="Select nationality"
			>
				{#each filteredNationalities as n (n.alpha2)}
					<li role="option" aria-selected={value === n.nationality}>
						<button
							type="button"
							class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent {value ===
							n.nationality
								? 'bg-accent'
								: ''}"
							onclick={() => selectNationality(n)}
						>
							{#if !flagFailed}
								<img
									src="https://flagcdn.com/w20/{n.alpha2.toLowerCase()}.png"
									width="20"
									height="15"
									alt={n.alpha2}
									class="object-cover"
									onerror={() => (flagFailed = true)}
								/>
							{:else}
								<span class="text-xs font-semibold text-muted-foreground">{n.alpha2}</span>
							{/if}
							<span class="truncate">{n.nationality} ({n.country})</span>
						</button>
					</li>
				{/each}
				{#if filteredNationalities.length === 0}
					<li class="px-3 py-4 text-center text-sm text-muted-foreground">
						No nationalities found
					</li>
				{/if}
			</ul>
		</div>

		<!-- Click-outside overlay -->
		<div class="fixed inset-0 z-40" role="presentation" onclick={() => (open = false)}></div>
	{/if}
</div>
