export function formatDate(dateString: string | null): string {
	if (!dateString) return '—';
	return new Date(dateString).toLocaleDateString('en-US', {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	});
}
