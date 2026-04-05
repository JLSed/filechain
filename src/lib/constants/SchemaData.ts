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
	'Edited Client'
] as const;

export const SEVERITY_LEVELS = ['warning', 'danger', 'neutral', 'notice'] as const;

export const NOTIFICATION_TYPES = [
	'New Application Submitted',
	'Application Updated',
	'File Uploaded',
	'Task Completed'
] as const;
