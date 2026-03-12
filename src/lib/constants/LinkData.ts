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

export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/forms': 'Filing Forms',
	'/reports': 'Reports',
	'/audit-logs': 'Audit Logs',
	'/patenting/client': 'Client Applications',
	'/patenting/ipophil': 'Application Timeline',
	'/files': 'File Storage',
	'/users': 'User Management'
};

// ── 3. Route protection ──
export const protectedRoutes = [
	'/dashboard',
	'/files',
	'/settings',
	'/users',
	'/forms',
	'/reports',
	'/audit-logs',
	'/patenting/client',
	'/patenting/ipophil'
];
export const authRoutes = ['/login', '/register'];

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
		url: '/patenting/client',
		icon: FileUser
	},
	{
		title: 'Application Timeline',
		url: '/patenting/ipophil',
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
