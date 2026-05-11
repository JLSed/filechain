import type { SupabaseClient } from '@supabase/supabase-js';
import { PERMISSION_KEYS, type PermissionKey } from '$lib/constants/SchemaData';

// ──────────────────────────────────────────────────────────
// Permission ↔ Route mapping
// ──────────────────────────────────────────────────────────

/**
 * Maps a permission key to the route prefixes it grants access to.
 * A user needs at least ONE permission that maps to a route prefix
 * in order to access that route.
 */
const PERMISSION_ROUTE_MAP: Record<string, string[]> = {
	'dashboard.view': ['/dashboard'],
	'applications.view': ['/application'],
	'applications.edit': ['/application'],
	'files.view': ['/files'],
	'files.upload': ['/files'],
	'files.download': ['/files'],
	'files.revision': ['/files'],
	'clients.view': ['/client'],
	'clients.edit': ['/client'],
	'invoices.view': ['/invoices'],
	'invoices.create': ['/invoices'],
	'invoices.edit': ['/invoices'],
	'reports.view': ['/reports'],
	'reports.generate': ['/reports'],
	'users.view': ['/users'],
	'users.create': ['/users'],
	'users.edit': ['/users'],
	'users.archive': ['/users'],
	'forms.view': ['/forms'],
	'forms.submit': ['/forms'],
	'audit_logs.view': ['/audit-logs'],
	'settings.view': ['/settings'],
	'settings.company': ['/settings/company'],
	'permissions.manage': ['/settings/permissions']
};

// ──────────────────────────────────────────────────────────
// Fetching permissions
// ──────────────────────────────────────────────────────────

/**
 * Fetches the granted permission keys for a given role from the database.
 * System Admin is a superuser — returns ALL permission keys.
 */
export async function fetchRolePermissions(
	supabase: SupabaseClient,
	role: string | null
): Promise<string[]> {
	if (!role) return [];

	// System Admin bypasses — return all known keys
	if (role === 'System Admin') {
		return [...PERMISSION_KEYS];
	}

	// Step 1: get permission_ids for this role
	const { data: rpData, error: rpError } = await supabase
		.schema('api')
		.from('role_permissions')
		.select('permission_id')
		.eq('role', role);

	if (rpError || !rpData) {
		console.error('Failed to fetch role permissions:', rpError);
		return [];
	}

	const permissionIds = rpData.map((row: { permission_id: string }) => row.permission_id);
	if (permissionIds.length === 0) return [];

	// Step 2: look up keys from the permissions table
	const { data: permData, error: permError } = await supabase
		.schema('api')
		.from('permissions')
		.select('key')
		.in('permission_id', permissionIds);

	if (permError || !permData) {
		console.error('Failed to fetch permission keys:', permError);
		return [];
	}

	return permData.map((row: { key: string }) => row.key);
}

// ──────────────────────────────────────────────────────────
// Permission checks
// ──────────────────────────────────────────────────────────

/**
 * Checks if a specific permission key is in the granted set.
 */
export function hasPermission(permissions: string[], key: PermissionKey): boolean {
	return permissions.includes(key);
}

/**
 * Returns all route prefixes a set of permissions grants access to.
 */
export function getRoutesForPermissions(permissions: string[]): string[] {
	const routes = new Set<string>();
	for (const perm of permissions) {
		const mapped = PERMISSION_ROUTE_MAP[perm];
		if (mapped) {
			for (const route of mapped) {
				routes.add(route);
			}
		}
	}
	return Array.from(routes);
}

/**
 * Returns true if the given permissions set grants access to `pathname`.
 * System Admin always returns true (but should already have all permissions).
 */
export function canAccessRouteByPermissions(
	role: string | null,
	permissions: string[],
	pathname: string
): boolean {
	// System Admin superuser bypass
	if (role === 'System Admin') return true;

	// Special: /settings/company requires settings.company permission
	// Check this BEFORE the generic /settings check to avoid false positives
	if (pathname === '/settings/company' || pathname.startsWith('/settings/company/')) {
		return permissions.includes('settings.company');
	}

	// Special: /settings/permissions requires permissions.manage permission
	if (pathname === '/settings/permissions' || pathname.startsWith('/settings/permissions/')) {
		return permissions.includes('permissions.manage');
	}

	const allowedRoutes = getRoutesForPermissions(permissions);

	return allowedRoutes.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Returns the first allowed route for a set of permissions, used for redirect.
 */
export function getDefaultRouteForPermissions(role: string | null, permissions: string[]): string {
	if (role === 'System Admin') return '/dashboard';

	const allowedRoutes = getRoutesForPermissions(permissions);

	// Prefer dashboard if available
	if (allowedRoutes.includes('/dashboard')) return '/dashboard';

	return allowedRoutes[0] ?? '/settings';
}
