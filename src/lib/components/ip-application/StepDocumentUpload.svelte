<script lang="ts">
	import { Input } from '$lib/shadcn/components/ui/input';
	import { Label } from '$lib/shadcn/components/ui/label';
	import { Button } from '$lib/shadcn/components/ui/button';
	import * as Select from '$lib/shadcn/components/ui/select';
	import { Upload, X } from '@lucide/svelte';
	import {
		DOCUMENT_CATEGORIES,
		type DocumentCategory,
		type IpApplicationFormData,
		type StagedFile
	} from '$lib/types/ip-application';

	let { formData = $bindable() }: { formData: IpApplicationFormData } = $props();

	let fileInput: HTMLInputElement | null = $state(null);
	let currentCategory: DocumentCategory = $state('Specification');

	function handleCategoryChange(value: string | undefined) {
		if (value) {
			currentCategory = value as DocumentCategory;
		}
	}

	function handleFileSelect(event: Event) {
		const target = event.target as HTMLInputElement;
		if (!target.files) return;

		const newFiles: StagedFile[] = Array.from(target.files).map((file) => ({
			file,
			category: currentCategory
		}));

		formData.files = [...formData.files, ...newFiles];

		// Reset input so the same file can be re-selected if needed
		target.value = '';
	}

	function removeFile(index: number) {
		formData.files = formData.files.filter((_, i) => i !== index);
	}

	function updateCategory(index: number, value: string | undefined) {
		if (!value) return;
		formData.files = formData.files.map((f, i) =>
			i === index ? { ...f, category: value as DocumentCategory } : f
		);
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / 1_048_576).toFixed(1)} MB`;
	}
</script>

<div class="space-y-6">
	<!-- Upload area -->
	<div class="space-y-3">
		<Label>Category for new files</Label>
		<div class="flex items-end gap-3">
			<div class="flex-1">
				<Select.Root type="single" value={currentCategory} onValueChange={handleCategoryChange}>
					<Select.Trigger class="w-full">
						{currentCategory}
					</Select.Trigger>
					<Select.Content>
						{#each DOCUMENT_CATEGORIES as cat (cat)}
							<Select.Item value={cat}>{cat}</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>
			</div>
			<Button variant="outline" onclick={() => fileInput?.click()} class="gap-2">
				<Upload class="size-4" />
				Choose Files
			</Button>
		</div>
		<input bind:this={fileInput} type="file" multiple class="hidden" onchange={handleFileSelect} />
		<p class="text-xs text-muted-foreground">
			Select the document category first, then choose files. You can change a file's category after
			adding it.
		</p>
	</div>

	<!-- File list -->
	{#if formData.files.length > 0}
		<div class="divide-y divide-border rounded-md border">
			{#each formData.files as staged, idx (staged.file.name + idx)}
				<div class="flex items-center gap-3 px-4 py-3">
					<!-- File name + size -->
					<div class="min-w-0 flex-1">
						<p class="truncate text-sm font-medium">{staged.file.name}</p>
						<p class="text-xs text-muted-foreground">{formatSize(staged.file.size)}</p>
					</div>
					<!-- Category selector -->
					<div class="w-44 shrink-0">
						<Select.Root
							type="single"
							value={staged.category}
							onValueChange={(v) => updateCategory(idx, v)}
						>
							<Select.Trigger class="h-8 w-full text-xs">
								{staged.category}
							</Select.Trigger>
							<Select.Content>
								{#each DOCUMENT_CATEGORIES as cat (cat)}
									<Select.Item value={cat}>{cat}</Select.Item>
								{/each}
							</Select.Content>
						</Select.Root>
					</div>
					<!-- Remove -->
					<Button
						variant="ghost"
						size="icon-sm"
						class="shrink-0 text-muted-foreground hover:text-destructive"
						onclick={() => removeFile(idx)}
					>
						<X class="size-4" />
					</Button>
				</div>
			{/each}
		</div>
	{:else}
		<div
			class="flex flex-col items-center gap-2 rounded-md border border-dashed border-muted-foreground/25 py-12 text-muted-foreground"
		>
			<Upload class="size-8 opacity-50" />
			<p class="text-sm">No files added yet. Choose files above to get started.</p>
		</div>
	{/if}
</div>
