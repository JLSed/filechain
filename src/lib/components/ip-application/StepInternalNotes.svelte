<script lang="ts">
	import { Textarea } from '$lib/shadcn/components/ui/textarea';
	import { Label } from '$lib/shadcn/components/ui/label';
	import type { IpApplicationFormData } from '$lib/types/ip-application';

	let { formData = $bindable() }: { formData: IpApplicationFormData } = $props();
</script>

<div class="space-y-4">
	<div class="space-y-2">
		<Label for="remarks">Internal Notes / Remarks</Label>
		<Textarea
			id="remarks"
			rows={8}
			placeholder="Add any internal remarks, special instructions, or notes for the team…"
			bind:value={formData.remarks}
		/>
		<p class="text-xs text-muted-foreground">
			These notes are for internal use only and will not be shared with the applicant.
		</p>
	</div>
</div>
