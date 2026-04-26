import {
	LayoutDashboard,
	Users,
	FileText,
	BookA,
	Building2,
	FileUser,
	FolderOpen,
	ChartArea,
	FileQuestion,
	Receipt,
	Settings
} from '@lucide/svelte';
import type { USER_ROLES } from '$lib/constants/SchemaData';

type UserRole = (typeof USER_ROLES)[number];

export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/forms': 'Filing Forms',
	'/reports': 'Reports',
	'/audit-logs': 'Audit Logs',
	'/application': 'Client Applications',
	'/application/no-app-num': 'No Application Number',
	'/application/timeline': 'Application Timeline',
	'/invoices': 'Invoices',
	'/files': 'File Storage',
	'/client': 'Client Profiles',
	'/users': 'User Management',
	'/settings': 'Settings',
	'/settings/company': 'Company Settings'
};

// ── Route protection ──
export const protectedRoutes = [
	'/dashboard',
	'/files',
	'/client',
	'/settings',
	'/users',
	'/forms',
	'/reports',
	'/audit-logs',
	'/application',
	'/application/no-app-num',
	'/application/timeline',
	'/invoices'
];
export const authRoutes = ['/login', '/register'];

// ── Role-based route access ──
// Routes each role is allowed to visit (beyond /dashboard and /settings which are always allowed).
// System Admin has access to everything, so it is not listed here.
const roleAllowedRoutes: Record<Exclude<UserRole, 'System Admin'>, string[]> = {
	'User Admin': ['/users'],
	'Finance Officer': ['/reports', '/invoices'],
	'Patent Team': ['/application', '/files', '/client'],
	'UM Team': ['/application', '/files', '/client'],
	'TM Team': ['/application', '/files', '/client'],
	'Application Officer': ['/forms'],
	Auditor: ['/audit-logs']
};

/** Routes accessible to every authenticated user regardless of role. */
const universalRoutes = ['/settings'];

/** Routes restricted to System Admin only — checked before universalRoutes. */
const systemAdminOnlyRoutes = ['/settings/company'];

/**
 * Returns true if the given role is authorized to access `pathname`.
 * System Admin can access everything. Other roles may access universal routes
 * plus their specifically allowed routes. Sub-routes (e.g. /application/[id])
 * are permitted if any allowed route is a prefix.
 */
export function canAccessRoute(role: string | null, pathname: string): boolean {
	if (role === 'System Admin') return true;

	// Block non-admins from system-admin-only routes before the universal check
	if (systemAdminOnlyRoutes.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
		return false;
	}

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
	}
];

export const analyticsGroup: Sidebar.Item[] = [
	{
		title: 'Reports',
		url: '/reports',
		icon: ChartArea
	},
	{
		title: 'Invoices',
		url: '/invoices',
		icon: Receipt
	}
];

export const patentingGroups: Sidebar.Item[] = [
	{
		title: 'Client Applications',
		url: '/application',
		icon: FileUser,
		children: [
			{ title: 'All Applications', url: '/application' },
			{ title: 'Missing Application No.', url: '/application/no-app-num', icon: FileQuestion }
		]
	},
	{
		title: 'Application Timeline',
		url: '/application/timeline',
		icon: Building2
	}
];

export const managementGroups: Sidebar.Item[] = [
	{
		title: 'Client Management',
		url: '/client',
		icon: Users,
		children: [
			{ title: 'Client Profiles', url: '/client' },
			{ title: 'Client Files', url: '/files', icon: FolderOpen }
		]
	},
	{
		title: 'User Management',
		url: '/users',
		icon: Users
	},
	{
		title: 'Audit Logs',
		url: '/audit-logs',
		icon: BookA
	}
];

export const settingsGroup: Sidebar.Item[] = [
	{
		title: 'Account Settings',
		url: '/settings',
		icon: Settings
	},
	{
		title: 'Company Settings',
		url: '/settings/company',
		icon: Building2
	}
];

export const sidebarGroups: Sidebar.Group[] = [
	{
		label: 'Overview',
		items: overviewGroup
	},
	{
		label: 'Analytics',
		items: analyticsGroup
	},
	{
		label: 'Patenting',
		items: patentingGroups
	},
	{
		label: 'Management',
		items: managementGroups
	},
	{
		label: 'Settings',
		items: settingsGroup
	}
];

/**
 * Filters sidebar groups so only items the user's role can access are included.
 * Groups with no remaining items are omitted entirely.
 * For items with children, only children whose routes the role can access are kept.
 */
export function getSidebarGroupsForRole(role: string | null): Sidebar.Group[] {
	if (role === 'System Admin') return sidebarGroups;

	return sidebarGroups
		.map((group) => ({
			...group,
			items: group.items
				.filter((item) => canAccessRoute(role, item.url))
				.map((item) => {
					if (!item.children) return item;
					return {
						...item,
						children: item.children.filter((child) => canAccessRoute(role, child.url))
					};
				})
		}))
		.filter((group) => group.items.length > 0);
}
