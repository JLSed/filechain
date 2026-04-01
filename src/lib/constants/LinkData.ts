import {
	LayoutDashboard,
	Users,
	FileText,
	BookA,
	Building2,
	FileUser,
	FolderOpen,
	ChartArea
} from '@lucide/svelte';
import type { USER_ROLES } from '$lib/constants/SchemaData';

type UserRole = (typeof USER_ROLES)[number];

export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/forms': 'Filing Forms',
	'/reports': 'Reports',
	'/audit-logs': 'Audit Logs',
	'/application': 'Client Applications',
	'/application/timeline': 'Application Timeline',
	'/files': 'File Storage',
	'/users': 'User Management'
};

// ── Route protection ──
export const protectedRoutes = [
	'/dashboard',
	'/files',
	'/settings',
	'/users',
	'/forms',
	'/reports',
	'/audit-logs',
	'/application',
	'/application/timeline'
];
export const authRoutes = ['/login', '/register'];

// ── Role-based route access ──
// Routes each role is allowed to visit (beyond /dashboard and /settings which are always allowed).
// System Admin has access to everything, so it is not listed here.
const roleAllowedRoutes: Record<Exclude<UserRole, 'System Admin'>, string[]> = {
	'User Admin': ['/users'],
	'Finance Officer': ['/reports'],
	'Patent Team': ['/application', '/files'],
	'UM Team': ['/application', '/files'],
	'TM Team': ['/application', '/files'],
	'Application Officer': ['/forms'],
	Auditor: ['/audit-logs']
};

/** Routes accessible to every authenticated user regardless of role. */
const universalRoutes = ['/settings'];

/**
 * Returns true if the given role is authorized to access `pathname`.
 * System Admin can access everything. Other roles may access universal routes
 * plus their specifically allowed routes. Sub-routes (e.g. /application/[id])
 * are permitted if any allowed route is a prefix.
 */
export function canAccessRoute(role: string | null, pathname: string): boolean {
	if (role === 'System Admin') return true;
	if (universalRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) return true;

	const allowed = roleAllowedRoutes[role as Exclude<UserRole, 'System Admin'>];
	if (!allowed) return false;

	return allowed.some((route) => pathname === route || pathname.startsWith(`${route}/`));
}

/**
 * Returns the first route the given role has access to.
 * Used for redirecting users who land on an unauthorized page.
 */
export function getDefaultRouteForRole(role: string | null): string {
	if (role === 'System Admin') return '/dashboard';

	const allowed = roleAllowedRoutes[role as Exclude<UserRole, 'System Admin'>];
	return allowed?.[0] ?? '/settings';
}

// ── Sidebar items ──
export const overviewGroup: Sidebar.Item[] = [
	{
		title: 'Dashboard',
		url: '/dashboard',
		icon: LayoutDashboard
	},
	{
		title: 'Filing Forms',
		url: '/forms',
		icon: FileText
	},
	{
		title: 'Reports',
		url: '/reports',
		icon: ChartArea
	},
	{
		title: 'Audit Logs',
		url: '/audit-logs',
		icon: BookA
	}
];

export const patentingGroups: Sidebar.Item[] = [
	{
		title: 'Client Applications',
		url: '/application',
		icon: FileUser
	},
	{
		title: 'Application Timeline',
		url: '/application/timeline',
		icon: Building2
	}
];

export const managementGroups: Sidebar.Item[] = [
	{
		title: 'File Storage',
		url: '/files',
		icon: FolderOpen
	},
	{
		title: 'User Management',
		url: '/users',
		icon: Users
	}
];

export const sidebarGroups: Sidebar.Group[] = [
	{
		label: 'Overview',
		items: overviewGroup
	},
	{
		label: 'Patenting',
		items: patentingGroups
	},
	{
		label: 'Management',
		items: managementGroups
	}
];

/**
 * Filters sidebar groups so only items the user's role can access are included.
 * Groups with no remaining items are omitted entirely.
 */
export function getSidebarGroupsForRole(role: string | null): Sidebar.Group[] {
	if (role === 'System Admin') return sidebarGroups;

	return sidebarGroups
		.map((group) => ({
			...group,
			items: group.items.filter((item) => canAccessRoute(role, item.url))
		}))
		.filter((group) => group.items.length > 0);
}
