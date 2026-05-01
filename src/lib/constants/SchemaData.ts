export const APPLICATION_STATUS = [
	'Client Intake',
	'Drafting',
	'Filing',
	'Examination',
	'Publication',
	'Grant',
	'Completed'
] as const;

export const USER_ROLES = [
	'System Admin',
	'User Admin',
	'Finance Officer',
	'Patent Team',
	'UM Team',
	'TM Team',
	'Application Officer',
	'Auditor'
] as const;

export const TEAM_ROLES = ['Patent Team', 'UM Team', 'TM Team'] as const;

export const FILE_CATEGORIES = [
	'Specification',
	'Claims',
	'Abstract',
	'Drawings',
	'Declaration',
	'Assignment',
	'Power of Attorney',
	'Priority Document',
	'Other'
] as const;

export const INVOICE_STATUSES = [
	'Draft',
	'Sent',
	'Partially Paid',
	'Paid',
	'Overdue',
	'Cancelled'
] as const;

export const LINE_ITEM_TYPES = ['professional_fee', 'disbursement'] as const;

export const PAYMENT_METHODS = ['Cash', 'Bank Transfer', 'Check', 'Online'] as const;

export const EWT_RATES = [
	{ label: 'None', value: 0 },
	{ label: '2% EWT', value: 0.02 },
	{ label: '10% EWT', value: 0.1 }
] as const;

export const AUDIT_EVENT_TYPES = [
	'Added Application',
	'Edited Application',
	'Submitted Application',
	'Edited File',
	'Added Account',
	'Edited Account',
	'Logged In',
	'Failed Login',
	'Added File',
	'Added Revision',
	'Viewed File',
	'Added Task',
	'Completed Task',
	'Edited Remarks',
	'Updated Status',
	'Edited Client',
	'Changed Password',
	'Created Invoice',
	'Edited Invoice',
	'Cancelled Invoice',
	'Recorded Payment',
	'Verified Integrity'
] as const;

export const SEVERITY_LEVELS = ['warning', 'danger', 'neutral', 'notice'] as const;

export const NOTIFICATION_TYPES = [
	'New Application Submitted',
	'Application Updated',
	'File Uploaded',
	'Task Completed',
	'Invoice Created',
	'Payment Recorded'
] as const;
