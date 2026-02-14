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
export const authRoutes = ['/login', '/register', '/dashboard/files'];

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
				href: '/dashboard/forms',
				icon: FileText
			},
			{
				label: 'Reports',
				href: '/dashboard/reports',
				icon: ChartArea
			},
			{
				label: 'Audit Logs',
				href: '/dashboard/audit-logs',
				icon: BookA
			}
		]
	},
	{
		label: 'Patenting',
		items: [
			{
				label: 'Patenting of Client',
				href: '/dashboard/patenting/client',
				icon: FileUser
			},
			{
				label: 'Patenting of IPOPHL',
				href: '/dashboard/patenting/ipophil',
				icon: Building2
			}
		]
	},
	{
		label: 'Management',
		items: [
			{
				label: 'File Management',
				href: '/dashboard/files',
				icon: FolderOpen
			},
			{
				label: 'User Management',
				href: '/dashboard/user',
				icon: Users
			}
		]
	}
];
