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

// for sidebar navigation groups
export const navGroups: Sidebar.NavGroup[] = [
	{
		label: 'Overview',
		items: [
			{
				label: 'Dashboard',
				href: '/dashboard',
				icon: LayoutDashboard
			},
			{
				label: 'Filling Forms',
				href: '/forms',
				icon: FileText
			},
			{
				label: 'Reports',
				href: '/reports',
				icon: ChartArea
			},
			{
				label: 'Audit Logs',
				href: '/audit-logs',
				icon: BookA
			}
		]
	},
	{
		label: 'Patenting',
		items: [
			{
				label: 'Patenting of Client',
				href: '/patenting/client',
				icon: FileUser
			},
			{
				label: 'Patenting of IPOPHL',
				href: '/patenting/ipophil',
				icon: Building2
			}
		]
	},
	{
		label: 'Management',
		items: [
			{
				label: 'File Management',
				href: '/files',
				icon: FolderOpen
			},
			{
				label: 'User Management',
				href: '/user',
				icon: Users
			}
		]
	}
];
