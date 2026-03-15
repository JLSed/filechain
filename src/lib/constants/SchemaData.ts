export const APPLICATION_STATUS = [
	'Assigned',
	'Extended',
	'Submitted',
	'For Pickup',
	'Closed'
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
	'Edited File',
	'Added Account',
	'Edited Account',
	'Logged In',
	'Failed Login'
] as const;

export const SEVERITY_LEVELS = ['warning', 'danger', 'neutral', 'notice'] as const;
