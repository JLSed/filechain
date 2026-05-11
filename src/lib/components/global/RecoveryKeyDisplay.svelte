<script lang="ts">
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import { Copy, Download, ShieldAlert, Check, Loader2 } from '@lucide/svelte';

	interface Props {
		recoveryKey: string;
		onAcknowledge: () => void;
		title?: string;
		description?: string;
		loading?: boolean;
	}

	let {
		recoveryKey,
		onAcknowledge,
		title = 'Your Recovery Key',
		description = 'Save this key in a secure location. You will need it to recover your account if you forget your password.',
		loading = false
	}: Props = $props();

	let acknowledged = $state(false);
	let copied = $state(false);

	function copyToClipboard() {
		navigator.clipboard.writeText(recoveryKey);
		copied = true;
		setTimeout(() => (copied = false), 2000);
	}

	function downloadAsFile() {
		const content = `FileChain Recovery Key\n${'='.repeat(40)}\n\nRecovery Key: ${recoveryKey}\n\nGenerated: ${new Date().toISOString()}\n\nIMPORTANT:\n- Store this file in a safe, offline location\n- Do NOT share this key with anyone\n- If you lose both your password and this key,\n  your encrypted files will be permanently inaccessible`;

		const blob = new Blob([content], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'filechain-recovery-key.txt';
		a.click();
		URL.revokeObjectURL(url);
	}

	// Format recovery key into groups of 8 characters for readability
	const formattedKey = $derived(recoveryKey.match(/.{1,8}/g)?.join(' ') ?? recoveryKey);
</script>

<div class="space-y-4">
	<div class="text-center">
		<div class="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
			<ShieldAlert class="h-7 w-7 text-amber-600" />
		</div>
		<h2 class="text-xl font-bold text-gray-900">{title}</h2>
		<p class="mt-1 text-sm text-muted-foreground">{description}</p>
	</div>

	<!-- Recovery key display -->
	<div class="rounded-lg border-2 border-dashed border-amber-300 bg-amber-50 p-4">
		<p class="text-center font-mono text-sm leading-relaxed tracking-wider break-all text-gray-800">
			{formattedKey}
		</p>
	</div>

	<!-- Action buttons -->
	<div class="flex gap-2">
		<Button variant="outline" class="flex-1" onclick={copyToClipboard} disabled={loading}>
			{#if copied}
				<Check class="mr-2 h-4 w-4 text-green-600" />
				Copied!
			{:else}
				<Copy class="mr-2 h-4 w-4" />
				Copy
			{/if}
		</Button>
		<Button variant="outline" class="flex-1" onclick={downloadAsFile} disabled={loading}>
			<Download class="mr-2 h-4 w-4" />
			Download
		</Button>
	</div>

	<!-- Warning -->
	<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
		<strong>⚠️ This key will NOT be shown again.</strong> If you lose both your password and this recovery
		key, your encrypted files will be permanently inaccessible.
	</div>

	<!-- Acknowledgment checkbox -->
	<label class="flex items-start gap-3 rounded-lg border border-border p-3 hover:bg-muted/50">
		<input
			type="checkbox"
			bind:checked={acknowledged}
			class="mt-0.5 h-4 w-4 rounded border-gray-300"
		/>
		<span class="text-sm text-gray-700">
			I have saved my recovery key in a secure location and understand it will not be shown again.
		</span>
	</label>

	<Button class="w-full" disabled={!acknowledged || loading} onclick={onAcknowledge}>
		{#if loading}
			<Loader2 class="mr-2 h-4 w-4 animate-spin" />
			Resetting password...
		{:else}
			Continue
		{/if}
	</Button>
</div>
