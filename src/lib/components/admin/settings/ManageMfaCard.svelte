<script lang="ts">
	import QRCode from 'qrcode';
	import { enhance } from '$app/forms';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import { ShieldCheck, RefreshCw, Loader2, AlertCircle, Copy, Check } from '@lucide/svelte';

	let isReEnrolling = $state(false);
	let qrDataUrl = $state('');
	let secret = $state('');
	let factorId = $state('');
	let code = $state('');
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let successMessage = $state('');
	let secretCopied = $state(false);

	async function startReEnroll(): Promise<void> {
		isReEnrolling = true;
		errorMessage = '';
		successMessage = '';

		try {
			const res = await fetch('?/enrollNewFactor', { method: 'POST' });
			const result = await res.json();

			// SvelteKit form action response format
			const data = result.data;
			if (data?.[1]?.enrollData) {
				const enrollData = data[1].enrollData;
				factorId = enrollData.factorId;
				secret = enrollData.secret;
				qrDataUrl = await QRCode.toDataURL(enrollData.qrCodeUri, { width: 200, margin: 2 });
			} else if (data?.[0] && typeof data[0] === 'number' && data[0] >= 400) {
				errorMessage = 'Failed to start re-enrollment. Please try again.';
				isReEnrolling = false;
			}
		} catch {
			errorMessage = 'Failed to start re-enrollment. Please try again.';
			isReEnrolling = false;
		}
	}

	function cancelReEnroll(): void {
		isReEnrolling = false;
		qrDataUrl = '';
		secret = '';
		factorId = '';
		code = '';
		errorMessage = '';
	}

	function copySecret(): void {
		navigator.clipboard.writeText(secret);
		secretCopied = true;
		setTimeout(() => (secretCopied = false), 2000);
	}
</script>

<div class="rounded-lg border border-border bg-card p-6">
	{#if isReEnrolling && qrDataUrl}
		<!-- Re-enrollment QR Code & Verify -->
		<div class="flex items-start gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<ShieldCheck class="h-5 w-5 text-primary" />
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-foreground">Change Authenticator Device</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Scan the new QR code with your authenticator app, then enter the code to confirm.
				</p>

				<div
					class="mt-4 flex flex-col items-center gap-4 rounded-lg border border-border bg-gray-50 p-4"
				>
					<img src={qrDataUrl} alt="2FA QR Code" class="rounded-md" />

					<div class="w-full">
						<p class="mb-1 text-center text-xs text-muted-foreground">
							Or enter this key manually:
						</p>
						<div class="flex items-center gap-2">
							<code
								class="flex-1 overflow-hidden rounded border border-border bg-white px-2 py-1 text-center font-mono text-xs tracking-wider text-ellipsis"
							>
								{secret}
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

				{#if errorMessage}
					<div class="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3">
						<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{errorMessage}</p>
					</div>
				{/if}

				<form
					method="POST"
					action="?/verifyNewFactor"
					class="mt-4 space-y-3"
					use:enhance={() => {
						isSubmitting = true;
						errorMessage = '';
						return async ({ result, update }) => {
							isSubmitting = false;
							if (result.type === 'failure') {
								errorMessage = (result.data as { error?: string })?.error ?? 'Verification failed.';
							} else if (result.type === 'success') {
								successMessage = 'Authenticator device changed successfully.';
								cancelReEnroll();
							}
							update();
						};
					}}
				>
					<input type="hidden" name="factorId" value={factorId} />

					<div class="space-y-2">
						<label for="mfa_code" class="text-sm font-medium text-foreground">
							Verification Code
						</label>
						<Input
							type="text"
							name="code"
							id="mfa_code"
							bind:value={code}
							placeholder="000000"
							maxlength={6}
							autocomplete="one-time-code"
							class="text-center font-mono text-lg tracking-[0.5em]"
							disabled={isSubmitting}
						/>
					</div>

					<div class="flex gap-2">
						<Button type="submit" disabled={isSubmitting || code.length !== 6} size="sm">
							{#if isSubmitting}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							{/if}
							Confirm
						</Button>
						<Button variant="outline" size="sm" onclick={cancelReEnroll}>Cancel</Button>
					</div>
				</form>
			</div>
		</div>
	{:else}
		<!-- Default state: show MFA status -->
		<div class="flex items-start gap-3">
			<div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
				<ShieldCheck class="h-5 w-5 text-primary" />
			</div>
			<div class="flex-1">
				<h3 class="font-semibold text-foreground">Two-Factor Authentication</h3>
				<p class="mt-1 text-sm text-muted-foreground">
					Your account is protected with an authenticator app.
				</p>

				<div
					class="mt-3 flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2"
				>
					<ShieldCheck class="h-4 w-4 text-green-600" />
					<span class="text-sm text-green-700">2FA is active</span>
				</div>

				{#if successMessage}
					<div class="mt-3 flex items-start gap-2 rounded-md bg-green-500/10 p-3">
						<Check class="mt-0.5 size-4 shrink-0 text-green-500" />
						<p class="text-sm text-green-500">{successMessage}</p>
					</div>
				{/if}

				{#if errorMessage}
					<div class="mt-3 flex items-start gap-2 rounded-md bg-destructive/10 p-3">
						<AlertCircle class="mt-0.5 size-4 shrink-0 text-destructive" />
						<p class="text-sm text-destructive">{errorMessage}</p>
					</div>
				{/if}

				<Button variant="outline" size="sm" class="mt-3" onclick={startReEnroll}>
					{#if isReEnrolling}
						<Loader2 class="mr-2 h-4 w-4 animate-spin" />
						Preparing...
					{:else}
						<RefreshCw class="mr-2 h-4 w-4" />
						Change Authenticator Device
					{/if}
				</Button>
			</div>
		</div>
	{/if}
</div>
