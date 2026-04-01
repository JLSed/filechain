<script lang="ts">
	import { FILE_CATEGORIES } from '$lib/constants/SchemaData';
	import { Separator } from '$lib/shadcn/components/ui/separator';
	import Button from '$lib/shadcn/components/ui/button/button.svelte';
	import type { SuperForm } from 'sveltekit-superforms';
	import type { Infer } from 'sveltekit-superforms';
	import type { IpApplicationFormSchema } from '$lib/types/FormTypes';

	let {
		form
	}: {
		form: SuperForm<Infer<typeof IpApplicationFormSchema>>['form'];
	} = $props();

	let dragging = $state(false);
	let fileInput: HTMLInputElement | undefined = $state();

	function addFiles(fileList: FileList) {
		const newFiles = Array.from(fileList).map((file) => ({
			file,
			category: 'Other' as (typeof FILE_CATEGORIES)[number]
		}));
		form.update(($form) => {
			$form.files = [...$form.files, ...newFiles];
			return $form;
		});
	}

	function handleDrop(e: DragEvent) {
		dragging = false;
		if (e.dataTransfer?.files?.length) {
			addFiles(e.dataTransfer.files);
		}
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files?.length) {
			addFiles(input.files);
			input.value = '';
		}
	}

	function updateCategory(index: number, category: string) {
		form.update(($form) => {
			$form.files[index].category = category as (typeof FILE_CATEGORIES)[number];
			return $form;
		});
	}

	function removeFile(index: number) {
		form.update(($form) => {
			$form.files = $form.files.filter((_, i) => i !== index);
			return $form;
		});
	}
</script>

<div class="space-y-6">
	<div>
		<h2 class="text-lg font-semibold text-foreground">Document Upload</h2>
		<p class="text-sm text-muted-foreground">Upload the required documents for this application.</p>
	</div>

	<div
		class="flex min-h-48 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors {dragging
			? 'border-primary bg-primary/5'
			: 'border-muted-foreground/30 hover:border-muted-foreground/50'}"
		ondragover={(e) => {
			e.preventDefault();
			dragging = true;
		}}
		ondragleave={() => (dragging = false)}
		ondrop={(e) => {
			e.preventDefault();
			handleDrop(e);
		}}
		onclick={() => fileInput?.click()}
		onkeydown={(e) => {
			if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
		}}
		role="button"
		tabindex="0"
	>
		<div class="text-center">
			<svg
				class="mx-auto mb-2 h-10 w-10 text-muted-foreground/50"
				xmlns="http://www.w3.org/2000/svg"
				fill="none"
				viewBox="0 0 24 24"
				stroke-width="1.5"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
				/>
			</svg>
			<p class="text-sm font-medium text-muted-foreground">
				{dragging ? 'Drop files here' : 'Drag & drop files here or click to browse'}
			</p>
		</div>
	</div>

	<input bind:this={fileInput} type="file" multiple class="hidden" onchange={handleFileInput} />

	<Separator />

	<!-- Uploaded files list -->
	<div>
		<h3 class="text-sm font-semibold text-foreground">Uploaded Files</h3>

		{#if $form.files.length === 0}
			<p class="mt-2 text-sm text-muted-foreground">No files uploaded yet.</p>
		{:else}
			<ul class="mt-2 space-y-2">
				{#each $form.files as file, i (i)}
					<li
						class="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
					>
						<span class="min-w-0 flex-1 truncate text-sm text-foreground">
							{file.file.name}
						</span>

						<div class="flex items-center gap-2">
							<select
								class="h-8 rounded-md border border-input bg-background px-2 text-sm text-foreground"
								value={file.category}
								onchange={(e) => updateCategory(i, (e.target as HTMLSelectElement).value)}
							>
								{#each FILE_CATEGORIES as cat (cat)}
									<option value={cat}>{cat}</option>
								{/each}
							</select>

							<Button
								type="button"
								variant="ghost"
								size="sm"
								onclick={() => removeFile(i)}
								class="text-destructive hover:text-destructive"
							>
								Remove
							</Button>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>
