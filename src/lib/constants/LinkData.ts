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
	Settings,
	Activity
} from '@lucide/svelte';
import {
	canAccessRouteByPermissions,
	getDefaultRouteForPermissions
} from '$lib/services/permissions';

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
	'/settings/company': 'Company Settings',
	'/settings/permissions': 'Role Permissions',
	'/system-health': 'System Health'
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
	'/invoices',
	'/system-health'
];
export const authRoutes = ['/login', '/register'];

// ── Permission-based route access ──

/**
 * Returns true if the given role + permissions are authorized to access `pathname`.
 * Delegates to the permission service for database-driven access control.
 */
export function canAccessRoute(
	role: string | null,
	pathname: string,
	permissions: string[] = []
): boolean {
	return canAccessRouteByPermissions(role, permissions, pathname);
}

/**
 * Returns the first route the given role has access to.
 * Used for redirecting users who land on an unauthorized page.
 */
export function getDefaultRouteForRole(role: string | null, permissions: string[] = []): string {
	return getDefaultRouteForPermissions(role, permissions);
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
		title: 'Generate Report',
		url: '/reports',
		icon: ChartArea
	},
	{
		title: 'Audit Logs',
		url: '/audit-logs',
		icon: BookA
	},
	{
		title: 'Invoices',
		url: '/invoices',
		icon: Receipt
	},
	{
		title: 'System Health',
		url: '/system-health',
		icon: Activity
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
 * Filters sidebar groups so only items the user's permissions allow are included.
 * Groups with no remaining items are omitted entirely.
 * For items with children, only children whose routes the permissions grant are kept.
 */
export function getSidebarGroupsForRole(
	role: string | null,
	permissions: string[] = []
): Sidebar.Group[] {
	if (role === 'System Admin') return sidebarGroups;

	return sidebarGroups
		.map((group) => ({
			...group,
			items: group.items
				.map((item) => {
					if (!item.children) return item;
					// For items with children, filter children first, then keep the parent
					// if at least one child is accessible
					return {
						...item,
						children: item.children.filter((child) => canAccessRoute(role, child.url, permissions))
					};
				})
				.filter((item) => {
					if (item.children) {
						// Keep parent if any child survived the filter
						return item.children.length > 0;
					}
					return canAccessRoute(role, item.url, permissions);
				})
		}))
		.filter((group) => group.items.length > 0);
}
