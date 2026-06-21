<script lang="ts">
	import QRCode from 'qrcode';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { Loader2, ShieldCheck, AlertCircle, Copy, Check } from '@lucide/svelte';
	import copyrightPana from '$lib/assets/copyright-pana.svg';
	import type { PageProps } from './$types';
	import { enhance } from '$app/forms';

	let { data }: PageProps = $props();

	let code = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let qrDataUrl = $state('');
	let secretCopied = $state(false);

	// Generate QR code data URL on mount
	$effect(() => {
		if (data.qrCodeUri) {
			QRCode.toDataURL(data.qrCodeUri, { width: 200, margin: 2 }).then((url) => {
				qrDataUrl = url;
			});
		}
	});

	function copySecret(): void {
		navigator.clipboard.writeText(data.secret);
		secretCopied = true;
		setTimeout(() => (secretCopied = false), 2000);
	}
</script>

<div class="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
	<div class="z-10 flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
		<!-- Left Side -->
		<div class="hidden w-1/2 flex-col justify-between bg-white p-12 lg:flex">
			<div class="flex flex-col items-center">
				<img
					src={copyrightPana}
					alt="Security Illustration"
					class="w-full max-w-md object-contain"
				/>
			</div>
		</div>

		<!-- Right Side -->
		<div class="flex w-full flex-col justify-center bg-white p-8 lg:w-1/2 lg:p-16">
			<div class="mx-auto w-full max-w-sm">
				<div class="mb-6 flex items-center gap-2">
					<ShieldCheck class="h-6 w-6 text-primary" />
					<h3 class="font-bold text-primary">Set Up Two-Factor Authentication</h3>
				</div>

				<p class="mb-6 text-sm text-muted-foreground">
					Scan the QR code below with your authenticator app (e.g., Google Authenticator, Authy),
					then enter the 6-digit code to activate 2FA.
				</p>

				<!-- QR Code Display -->
				<div
					class="mb-6 flex flex-col items-center gap-4 rounded-lg border border-border bg-gray-50 p-6"
				>
					{#if qrDataUrl}
						<img src={qrDataUrl} alt="2FA QR Code" class="rounded-md" />
					{:else}
						<div class="flex h-[200px] w-[200px] items-center justify-center">
							<Loader2 class="h-8 w-8 animate-spin text-muted-foreground" />
						</div>
					{/if}

					<!-- Manual secret -->
					<div class="w-full">
						<p class="mb-1 text-center text-xs text-muted-foreground">
							Or enter this key manually:
						</p>
						<div class="flex items-center gap-2">
							<code
								class="flex-1 overflow-hidden rounded border border-border bg-white px-2 py-1 text-center font-mono text-xs tracking-wider text-ellipsis"
							>
								{data.secret}
							</code>
							<button
								type="button"
								onclick={copySecret}
								class="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
								aria-label="Copy secret"
							>
								{#if secretCopied}
									<Check class="h-4 w-4 text-green-500" />
								{:else}
									<Copy class="h-4 w-4" />
								{/if}
							</button>
						</div>
					</div>
				</div>

				<!-- Verification Form -->
				{#if errorMessage}
					<div class="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3">
						<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{errorMessage}</p>
					</div>
				{/if}

				<form
					method="POST"
					action="?/verify"
					use:enhance={() => {
						isSubmitting = true;
						errorMessage = '';
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'failure') {
								errorMessage = (result.data as { error?: string })?.error ?? 'Verification failed.';
							}
							update();
						};
					}}
					class="flex flex-col gap-4"
				>
					<input type="hidden" name="factorId" value={data.factorId} />

					<div class="space-y-2">
						<label for="totp_code" class="text-sm leading-none font-medium text-foreground">
							Verification Code
						</label>
						<Input
							type="text"
							name="code"
							id="totp_code"
							bind:value={code}
							placeholder="000000"
							maxlength={6}
							autocomplete="one-time-code"
							class="text-center font-mono text-lg tracking-[0.5em]"
							disabled={isSubmitting}
						/>
					</div>

					<Button
						type="submit"
						disabled={isSubmitting || code.length !== 6}
						class="w-full"
						size="lg"
					>
						{#if isSubmitting}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Verifying...
						{:else}
							Activate 2FA
						{/if}
					</Button>
				</form>
			</div>
		</div>
	</div>
</div>
