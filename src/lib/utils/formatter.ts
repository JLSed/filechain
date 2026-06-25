import type { IpApplication } from '$lib/types/DatabaseTypes';

export function formatDate(dateString: string | null): string {
	if (!dateString) return 'N/A';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}

export function getClientName(app: IpApplication): string {
	const parts = [app.client_profiles?.first_name, app.client_profiles?.last_name].filter(Boolean);
	return parts.length > 0 ? parts.join(' ') : 'N/A';
}

export function formatName(firstName: string, middleName: string | null, lastName: string): string {
	return `${firstName.charAt(0).toUpperCase()}. ${middleName ? middleName.charAt(0).toUpperCase() + '. ' : ''} ${lastName}`;
}

export function formatFileSize(bytes: number): string {
	if (bytes < 1024) return `${bytes}b`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}kb`;
	return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
}

/**
 * Formats a UTC timestamp into a readable string.
 * e.g. "Mar 15, 2026 - 1:03 PM"
 */
export function formatTimestamp(ts: string): string {
	const date = new Date(ts);
	const month = date.toLocaleString('en-US', { month: 'short' });
	const day = date.getDate();
	const year = date.getFullYear();
	const time = date.toLocaleString('en-US', {
		hour: 'numeric',
		minute: '2-digit',
		hour12: true
	});
	return `${month} ${day}, ${year} - ${time}`;
}

/**
 * Returns a human-readable countdown string for a deadline.
 * e.g. "3 Day(s) Left", "Due Today", or "Overdue"
 */
export function getDaysLeft(deadline: string | null): string | null {
	if (!deadline) return null;
	const now = new Date();
	now.setHours(0, 0, 0, 0);
	const target = new Date(deadline);
	target.setHours(0, 0, 0, 0);
	const diff = Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
	if (diff < 0) return 'Overdue';
	if (diff === 0) return 'Due Today';
	return `${diff} Day(s) Left`;
}
