import type Sidebar from '$lib/components/shadcn/ui/sidebar/sidebar.svelte';
import {
	LayoutDashboard,
	Users,
	FileText,
	BookA,
	Building2,
	FileUser,
	FolderOpen,
	ChartArea
} from 'lucide-svelte';

export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/dashboard/forms': 'Filling Forms',
	'/dashboard/reports': 'Reports',
	'/dashboard/audit-logs': 'Audit Logs',
	'/dashboard/patenting/client': 'Patenting of Client',
	'/dashboard/patenting/ipophil': 'Patenting of IPOPHL',
	'/dashboard/files': 'File Management',
	'/dashboard/user': 'User Management'
};

// ── 3. Route protection ──
export const protectedRoutes = ['/dashboard', '/files', '/settings', '/account'];
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
		url: '/dashboard/forms',
		icon: FileText
	},
	{
		title: 'Reports',
		url: '/dashboard/reports',
		icon: ChartArea
	},
	{
		title: 'Audit Logs',
		url: '/dashboard/audit-logs',
		icon: BookA
	}
];

export const patentingGroups: Sidebar.Item[] = [
	{
		title: 'Patenting of Client',
		url: '/dashboard/patenting/client',
		icon: FileUser
	},
	{
		title: 'Patenting of IPOPHL',
		url: '/dashboard/patenting/ipophil',
		icon: Building2
	}
];

export const managementGroups: Sidebar.Item[] = [
	{
		title: 'File Management',
		url: '/dashboard/files',
		icon: FolderOpen
	},
	{
		title: 'User Management',
		url: '/dashboard/user',
		icon: Users
	}
];
