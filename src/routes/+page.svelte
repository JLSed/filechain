<script lang="ts">
	import { onMount } from 'svelte';
	import init, { greet } from '../lib/pkg/rust';

	let { data } = $props();
	let wasmReady = $state(false);

	onMount(async () => {
		await init();
		wasmReady = true;
	});
</script>

<div class="mx-auto max-w-4xl py-20 text-center">
	<h1
		class="mb-6 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-6xl font-bold text-transparent"
	>
		Filechain
	</h1>

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
