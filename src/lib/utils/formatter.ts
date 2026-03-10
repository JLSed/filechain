import type { IpApplication } from '$lib/types/DatabaseTypes';

export function formatDate(dateString: string | null): string {
	if (!dateString) return '—';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function getClientName(app: IpApplication): string {
	const parts = [app.client_profiles.first_name, app.client_profiles.last_name].filter(Boolean);
	return parts.length > 0 ? parts.join(' ') : '—';
}

export function formatName(firstName: string, middleName: string | null, lastName: string): string {
	return `${firstName.charAt(0).toUpperCase()}. ${middleName ? middleName.charAt(0).toUpperCase() + '. ' : ''} ${lastName}`;
}
