<script lang="ts">
	import LoginForm from '$lib/components/landing/login/LoginForm.svelte';
	import copyrightPana from '$lib/assets/copyright-pana.svg';
	import type { PageProps } from './$types';
	let { data }: PageProps = $props();
</script>

<div class="relative flex min-h-screen w-full items-center justify-center bg-gray-50 p-4">
	<!-- <img src={layeredWaves} alt="" class="absolute inset-0 h-full w-full object-cover" /> -->
	<div class="z-10 flex w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-xl">
		<!-- Left Side -->
		<div class="hidden w-1/2 flex-col justify-between bg-white p-12 lg:flex">
			<!-- Illustration Content -->
			<div class="flex flex-col items-center">
				<img
					src={copyrightPana}
					alt="Asset Management Illustration"
					class="w-full max-w-md object-contain"
				/>
			</div>
		</div>

		<!-- Right Side -->
		<div class="flex w-full flex-col justify-center bg-white p-8 lg:w-1/2 lg:p-16">
			<LoginForm {data} />
		</div>
	</div>
</div>
