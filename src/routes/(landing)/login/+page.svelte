<script lang="ts">
	import { enhance } from '$app/forms';
	import LoginForm from '$lib/components/landing/login/LoginForm.svelte';
	import Input from '$lib/shadcn/components/ui/input/input.svelte';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div>
	page form
	<form method="POST" action="/login?/login">
		<Input type="text" name="email" placeholder="Page" />
	</form>
	<LoginForm {data} />
</div>
