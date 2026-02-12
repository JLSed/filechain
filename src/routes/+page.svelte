<script lang="ts">
	import { onMount } from 'svelte';
	import init, { greet } from '../lib/pkg/rust';
	let wasmReady = false;

	onMount(async () => {
		await init();
		wasmReady = true;
	});
</script>

{#if !wasmReady}
	<p>Loading WebAssembly...</p>
{/if}

<h1>Welcome to filechain</h1>
<button onclick={() => greet()}>Greet test</button>
