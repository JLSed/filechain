<script lang="ts">
	// HeroSection.svelte - Light Mode Version
</script>

<div
	class="relative flex min-h-[calc(100vh-4rem)] w-full items-center justify-center overflow-hidden bg-background px-4 py-20 text-foreground transition-colors duration-300"
>
	<!-- Background Spotlight Glow (Soft primary color tint) -->
	<div
		class="pointer-events-none absolute inset-0 z-0 opacity-40"
		style="background: radial-gradient(circle at 50% 45%, color-mix(in srgb, var(--primary) 8%, transparent) 0%, transparent 60%);"
	></div>

	<!-- Background Flowing Curves (Subtle watermark style for Light Mode) -->
	<svg
		class="pointer-events-none absolute inset-0 z-0 h-full w-full opacity-15"
		viewBox="0 0 1440 800"
		fill="none"
		xmlns="http://www.w3.org/2000/svg"
		preserveAspectRatio="none"
	>
		<defs>
			<linearGradient id="line-grad-1" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="var(--primary)" stop-opacity="0" />
				<stop offset="35%" stop-color="var(--primary)" stop-opacity="0.6" />
				<stop offset="65%" stop-color="var(--primary)" stop-opacity="0.4" />
				<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
			</linearGradient>
			<linearGradient id="line-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
				<stop offset="0%" stop-color="var(--primary)" stop-opacity="0" />
				<stop offset="50%" stop-color="var(--primary)" stop-opacity="0.5" />
				<stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
			</linearGradient>
			<filter id="glow" x="-10%" y="-10%" width="120%" height="120%">
				<feGaussianBlur stdDeviation="4" result="blur" />
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			</filter>
		</defs>

		<!-- Smooth flowing wave paths -->
		<path
			d="M -100 350 C 300 150, 600 550, 1540 250"
			stroke="url(#line-grad-1)"
			stroke-width="2"
			filter="url(#glow)"
		/>
		<path
			d="M -100 400 C 400 500, 800 200, 1540 450"
			stroke="url(#line-grad-2)"
			stroke-width="1.5"
			stroke-dasharray="4 4"
		/>
		<path
			d="M -100 480 C 250 300, 1000 600, 1540 380"
			stroke="url(#line-grad-1)"
			stroke-width="1"
			opacity="0.5"
		/>
	</svg>

	<!-- Content Container -->
	<div class="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
		<!-- Main Heading -->
		<h1
			class="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl"
		>
			<span class="block text-zinc-900 drop-shadow-xs">Securing your digital</span>
			<span class="block text-zinc-900 drop-shadow-xs">assets,</span>
			<span
				class="mt-4 block leading-none font-black text-[var(--primary)] drop-shadow-[0_2px_10px_rgba(65,105,225,0.08)]"
			>
				cryptographically.
			</span>
		</h1>

		<!-- Inspect Security Mechanics Button -->
		<a href="/login" class="group mt-24 flex cursor-pointer flex-col items-center gap-2">
			<span
				class="font-mono text-xs tracking-[0.2em] text-muted-foreground/70 uppercase transition-colors duration-300 group-hover:text-[var(--primary)]"
			>
				Click to Login
			</span>
			<span
				class="h-[1px] w-8 bg-muted-foreground/30 transition-all duration-300 group-hover:w-16 group-hover:bg-[var(--primary)]"
			></span>
		</a>
	</div>
</div>
