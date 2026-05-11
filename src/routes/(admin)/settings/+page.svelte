<script lang="ts">
	import type { PageProps } from './$types';
	import ChangePasswordForm from '$lib/components/admin/settings/ChangePasswordForm.svelte';
	import GenerateRecoveryKeyCard from '$lib/components/admin/settings/GenerateRecoveryKeyCard.svelte';

	let { data }: PageProps = $props();
</script>

<div class="flex flex-col gap-6 p-6">
	<div>
		<h1 class="text-2xl font-bold tracking-tight">Account Settings</h1>
		<p class="text-sm text-muted-foreground">
			Manage your account preferences and security settings.
		</p>
	</div>

	<ChangePasswordForm {data} />

	<GenerateRecoveryKeyCard hasRecoveryKey={data.hasRecoveryKey} userSecret={data.userSecret} />
</div>
