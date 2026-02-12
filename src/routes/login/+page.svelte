<script>
	import LoginForm from '$lib/components/LoginForm.svelte';
	import copyrightPana from '$lib/assets/copyright-pana.svg';
	import dmvLogo from '$lib/assets/dmv-logo.svg';
</script>

<div class="flex h-screen items-center justify-center">
	<div class="flex shadow">
		<div class="h-50 w-50">
			<img src={copyrightPana} alt="copyright illustration" />
			<img src={dmvLogo} alt="copyright illustration" />
		</div>
		<div class="p-4">
			<LoginForm />
		</div>
	</div>
</div>
