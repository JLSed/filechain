<script lang="ts">
	import {
		CalendarDate,
		parseDate,
		today,
		getLocalTimeZone,
		type DateValue
	} from '@internationalized/date';
	import { Calendar } from '$lib/shadcn/components/ui/calendar';
	import * as Popover from '$lib/shadcn/components/ui/popover';
	import { Button } from '$lib/shadcn/components/ui/button';
	import { CalendarIcon } from '@lucide/svelte';
	import { cn } from '$lib/shadcn/utils';

	let {
		value = $bindable(''),
		placeholder = 'Pick a date',
		id = undefined
	}: {
		value: string;
		placeholder?: string;
		id?: string;
	} = $props();

	/** Convert the string (YYYY-MM-DD) to a CalendarDate for the calendar */
	const calendarValue = $derived.by((): CalendarDate | undefined => {
		if (!value) return undefined;
		try {
			const d = parseDate(value);
			return new CalendarDate(d.year, d.month, d.day);
		} catch {
			return undefined;
		}
	});

	/** Human-readable label shown on the trigger button */
	const displayLabel = $derived.by(() => {
		if (!value) return placeholder;
		try {
			return parseDate(value).toDate(getLocalTimeZone()).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric'
			});
		} catch {
			return placeholder;
		}
	});

	let open = $state(false);

	function onSelect(selected: DateValue | undefined) {
		if (!selected) {
			value = '';
		} else {
			// Pad month/day to YYYY-MM-DD
			const mm = String(selected.month).padStart(2, '0');
			const dd = String(selected.day).padStart(2, '0');
			value = `${selected.year}-${mm}-${dd}`;
		}
		open = false;
	}
</script>

<Popover.Root bind:open>
	<Popover.Trigger>
		{#snippet child({ props })}
			<Button
				{...props}
				variant="outline"
				{id}
				class={cn('w-full justify-start text-left font-normal', !value && 'text-muted-foreground')}
			>
				<CalendarIcon class="mr-2 size-4 shrink-0" />
				{displayLabel}
			</Button>
		{/snippet}
	</Popover.Trigger>
	<Popover.Content class="w-auto p-0" align="start">
		<Calendar
			type="single"
			captionLayout="dropdown"
			value={calendarValue}
			onValueChange={onSelect}
			initialFocus
		/>
	</Popover.Content>
</Popover.Root>
