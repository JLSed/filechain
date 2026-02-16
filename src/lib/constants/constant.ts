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
	'/forms': 'Filling Forms',
	'/reports': 'Reports',
	'/audit-logs': 'Audit Logs',
	'/patenting/client': 'Patenting of Client',
	'/patenting/ipophil': 'Patenting of IPOPHL',
	'/files': 'File Management',
	'/user': 'User Management'
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

export const ICON_SIZE_SMALL = 18;
export const ICON_SIZE_MEDIUM = 22;
export const ICON_SIZE_LARGE = 28;

export const overviewGroup: Sidebar.Item[] = [
	{
		title: 'Dashboard',
		url: '/dashboard',
		icon: LayoutDashboard
	},
	{
		title: 'Filling Forms',
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
		title: 'Patenting of Client',
		url: '/patenting/client',
		icon: FileUser
	},
	{
		title: 'Patenting of IPOPHL',
		url: '/patenting/ipophil',
		icon: Building2
	}
];

export const managementGroups: Sidebar.Item[] = [
	{
		title: 'File Management',
		url: '/files',
		icon: FolderOpen
	},
	{
		title: 'User Management',
		url: '/user',
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
