<script lang="ts">
	import { Separator } from '$lib/shadcn/components/ui/separator';
	import { Badge } from '$lib/shadcn/components/ui/badge';
	import type {
		IpApplicationFormData,
		TypeOfInvention,
		PreProtectionStatus,
		TypeOfOfficeAction
	} from '$lib/types/filing-forms/ip-application';

	let {
		formData,
		inventionTypes,
		protectionStatuses,
		officeActions
	}: {
		formData: IpApplicationFormData;
		inventionTypes: TypeOfInvention[];
		protectionStatuses: PreProtectionStatus[];
		officeActions: TypeOfOfficeAction[];
	} = $props();

	const inventionTypeName = $derived(
		inventionTypes.find((t) => t.id === formData.typeOfInventionId)?.name ?? '—'
	);
	const protectionStatusName = $derived(
		protectionStatuses.find((s) => s.id === formData.preProtectionStatusId)?.name ?? '—'
	);
	const officeActionName = $derived(
		officeActions.find((a) => a.id === formData.typeOfOfficeActionId)?.name ?? '—'
	);
</script>

<div class="space-y-6">
	<!-- Section: Client Information -->
	<div>
		<h3 class="text-base font-semibold">Client Information</h3>
		<Separator class="my-3" />
		<dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">First Name</dt>
				<dd class="font-medium">{formData.clientFirstName || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Middle Name</dt>
				<dd class="font-medium">{formData.clientMiddleName || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Last Name</dt>
				<dd class="font-medium">{formData.clientLastName || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Email</dt>
				<dd class="font-medium">{formData.clientEmail || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Mobile Number</dt>
				<dd class="font-medium">
					{formData.clientDialCode && formData.clientMobileNumber
						? `${formData.clientDialCode} ${formData.clientMobileNumber}`
						: '—'}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Nationality</dt>
				<dd class="font-medium">{formData.clientNationality || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Company</dt>
				<dd class="font-medium">{formData.clientCompany || '—'}</dd>
			</div>
			<div class="sm:col-span-2">
				<dt class="text-muted-foreground">Company Address</dt>
				<dd class="font-medium">{formData.clientCompanyAddress || '—'}</dd>
			</div>
		</dl>
	</div>

	<!-- Section: Application Details -->
	<div>
		<h3 class="text-base font-semibold">Application Details</h3>
		<Separator class="my-3" />
		<dl class="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">Application Number</dt>
				<dd class="font-medium">{formData.applicationNumber || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Title of Invention</dt>
				<dd class="font-medium">{formData.titleOfInvention || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Type of Invention</dt>
				<dd class="font-medium">{inventionTypeName}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Pre-Protection Status</dt>
				<dd class="font-medium">{protectionStatusName}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Office Action Type</dt>
				<dd class="font-medium">{officeActionName}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Filing Date</dt>
				<dd class="font-medium">{formData.fillingDate || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Deadline</dt>
				<dd class="font-medium">{formData.deadline || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Fees (PHP)</dt>
				<dd class="font-medium">{formData.fees || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Paper Document No.</dt>
				<dd class="font-medium">{formData.paperDocumentNo || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Mailing Date</dt>
				<dd class="font-medium">{formData.mailingDate || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Publication Date</dt>
				<dd class="font-medium">{formData.publicationDate || '—'}</dd>
			</div>
			<div class="sm:col-span-2">
				<dt class="text-muted-foreground">Inventor(s)</dt>
				<dd class="font-medium">{formData.inventorNames || '—'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Contact Details</dt>
				<dd class="font-medium">{formData.contactDetails || '—'}</dd>
			</div>
		</dl>
	</div>

	<!-- Section: Documents -->
	<div>
		<h3 class="text-base font-semibold">Documents ({formData.files.length})</h3>
		<Separator class="my-3" />
		{#if formData.files.length > 0}
			<ul class="space-y-1 text-sm">
				{#each formData.files as staged, idx (staged.file.name + idx)}
					<li class="flex items-center gap-2">
						<Badge variant="outline" class="shrink-0 text-xs">{staged.category}</Badge>
						<span class="truncate">{staged.file.name}</span>
					</li>
				{/each}
			</ul>
		{:else}
			<p class="text-sm text-muted-foreground">No documents attached.</p>
		{/if}
	</div>

	<!-- Section: Internal Notes -->
	<div>
		<h3 class="text-base font-semibold">Internal Notes</h3>
		<Separator class="my-3" />
		<p class="text-sm whitespace-pre-wrap">{formData.remarks || 'No remarks.'}</p>
	</div>
</div>
