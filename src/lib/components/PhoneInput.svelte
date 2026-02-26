<script lang="ts">
	import phoneFormats from '$lib/constants/phone_format.json';

	interface PhoneFormat {
		name: string;
		code: string;
		dial_code: string;
		mask: string;
		digits: number;
		formatted_length: number;
	}

	const countries: PhoneFormat[] = phoneFormats as PhoneFormat[];

	let {
		value = $bindable(''),
		dialCode = $bindable('+63'),
		required = false
	}: {
		value: string;
		dialCode: string;
		required?: boolean;
	} = $props();

	let open = $state(false);
	let searchQuery = $state('');
	let flagFailed = $state(false);

	const defaultCountry = countries.find((c) => c.dial_code === '+63') ?? countries[0];
	let activeCountry = $state<PhoneFormat>(
		countries.find((c) => c.dial_code === dialCode) ?? defaultCountry
	);

	const filteredCountries = $derived(
		countries.filter(
			(c) =>
				c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				c.dial_code.includes(searchQuery)
		)
	);

	function selectCountry(country: PhoneFormat) {
		activeCountry = country;
		dialCode = country.dial_code;
		value = '';
		open = false;
		searchQuery = '';
	}

	function formatPhone(raw: string, mask: string): string {
		const digits = raw.replace(/\D/g, '');
		let result = '';
		let di = 0;
		for (let i = 0; i < mask.length && di < digits.length; i++) {
			if (mask[i] === '#') {
				result += digits[di++];
			} else {
				result += mask[i];
			}
		}
		return result;
	}

	function onInput(e: Event) {
		const input = e.currentTarget as HTMLInputElement;
		const formatted = formatPhone(input.value, activeCountry.mask);
		value = formatted;
		// Force the DOM value to stay in sync after formatting
		input.value = formatted;
	}

	function handleDropdownKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape') open = false;
	}

	function handleTriggerKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			open = !open;
		}
	}
</script>

<div class="relative flex w-full">
	<!-- Country selector trigger -->
	<button
		type="button"
		class="flex shrink-0 items-center gap-1.5 rounded-l-md border border-r-0 border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-accent focus:outline-none"
		onclick={() => (open = !open)}
		onkeydown={handleTriggerKeydown}
		aria-haspopup="listbox"
		aria-expanded={open}
	>
		{#if !flagFailed}
			<img
				src="https://flagcdn.com/w20/{activeCountry.code.toLowerCase()}.png"
				width="20"
				height="15"
				alt={activeCountry.code}
				class=" object-cover"
				onerror={() => (flagFailed = true)}
			/>
		{:else}
			<span class="fallback-text">{activeCountry.code}</span>
		{/if}
		<span class="w-10 text-xs text-muted-foreground tabular-nums">{activeCountry.dial_code}</span>
		<svg
			class="size-3 shrink-0 text-muted-foreground transition-transform {open ? 'rotate-180' : ''}"
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

	<!-- Phone number input -->
	<input
		type="tel"
		placeholder={activeCountry.mask.replace(/#/g, '0')}
		maxlength={activeCountry.formatted_length}
		class="flex h-10 w-full rounded-r-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
		{required}
		{value}
		oninput={onInput}
	/>

	<!-- Dropdown -->
	{#if open}
		<!-- svelte-ignore a11y_no_static_element_interactions -->
		<div
			class="absolute top-full left-0 z-50 mt-1 w-72 rounded-md border border-border bg-popover shadow-md"
			onkeydown={handleDropdownKeydown}
		>
			<!-- Search -->
			<div class="border-b border-border p-2">
				<input
					type="text"
					placeholder="Search country..."
					class="w-full rounded-sm border border-input bg-background px-2 py-1.5 text-sm placeholder:text-muted-foreground focus:outline-none"
					bind:value={searchQuery}
				/>
			</div>

			<!-- Country list -->
			<ul class="max-h-60 overflow-y-auto py-1" role="listbox" aria-label="Select country">
				{#each filteredCountries as country (country.code)}
					<li role="option" aria-selected={activeCountry.code === country.code}>
						<button
							type="button"
							class="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-accent {activeCountry.code ===
							country.code
								? 'bg-accent'
								: ''}"
							onclick={() => selectCountry(country)}
						>
							{#if !flagFailed}
								<img
									src="https://flagcdn.com/w20/{country.code.toLowerCase()}.png"
									width="20"
									height="15"
									alt={country.code}
									class=" object-cover"
									onerror={() => (flagFailed = true)}
								/>
							{:else}
								<span class="fallback-text">{country.code}</span>
							{/if}
							<span class="w-10 shrink-0 text-muted-foreground tabular-nums"
								>{country.dial_code}</span
							>
							<span class="truncate">{country.name}</span>
						</button>
					</li>
				{/each}
				{#if filteredCountries.length === 0}
					<li class="px-3 py-4 text-center text-sm text-muted-foreground">No countries found</li>
				{/if}
			</ul>
		</div>

		<!-- Click-outside overlay -->
		<!-- svelte-ignore a11y_click_events_have_key_events a11y_no_static_element_interactions -->
		<div class="fixed inset-0 z-40" role="presentation" onclick={() => (open = false)}></div>
	{/if}
</div>
