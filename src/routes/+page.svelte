<script lang="ts">
	import { onMount } from 'svelte';
	import init, { greet } from '../lib/pkg/rust';
	import dmvLogo from '$lib/assets/dmv-logo.svg';

	let { data } = $props();
	let wasmReady = $state(false);

	onMount(async () => {
		await init();
		wasmReady = true;
	});
</script>

<div class="mx-auto max-w-4xl py-20 text-center">
	<!-- Logo -->
	<div class="flex items-center gap-3">
		<div class="flex h-14 w-14 items-center justify-center">
			<img src={dmvLogo} alt="Logo" class="h-full w-full object-contain" />
		</div>
		<span class="text-xl font-bold tracking-tight text-slate-800">DMV IP Consultancy</span>
	</div>

	<p class="mx-auto mb-12 max-w-2xl text-xl text-zinc-400">
		Secure cloud storage with zero-knowledge encryption powered by Rust & WebAssembly.
	</p>

	<div class="mb-16 flex justify-center gap-4">
		{#if data.session}
			<a
				href="/dashboard"
				class="rounded-full bg-emerald-600 px-8 py-3 font-semibold text-white transition-all hover:bg-emerald-500"
			>
				Go to Dashboard
			</a>
		{:else}
			<a
				href="/login"
				class="rounded-full bg-zinc-100 px-8 py-3 font-semibold text-zinc-900 transition-all hover:bg-white"
			>
				Get Started
			</a>
		{/if}

		<button
			onclick={() => greet()}
			disabled={!wasmReady}
			class="rounded-full border border-zinc-700 px-8 py-3 font-semibold transition-all hover:border-zinc-500 disabled:cursor-wait disabled:opacity-50"
		>
			{#if !wasmReady}
				Initializing Wasm...
			{:else}
				Test Rust Module
			{/if}
		</button>
	</div>
</div>
