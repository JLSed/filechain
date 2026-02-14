import {
	LayoutDashboard,
	BarChart3,
	Link2,
	HardDrive,
	ScrollText,
	Users,
	FileText
} from 'lucide-svelte';

export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/dashboard/files': 'Files'
};

// ── 3. Route protection ──
export const protectedRoutes = ['/dashboard', '/files', '/settings', '/account'];
export const authRoutes = ['/login', '/register', '/auth'];

// for sidebar navigation groups
export const navGroups: Sidebar.NavGroup[] = [
	{
		label: 'Overview',
		items: [
			{
				label: 'Dashboard',
				href: '/dashboard',
				icon: LayoutDashboard // <LayoutDashboard size={20} />
			},
			{
				label: 'Filling Forms',
				href: '/dashboard/forms',
				icon: FileText
			},
			{
				label: 'Analytics',
				href: '/dashboard/analytics',
				icon: BarChart3
			},
			{
				label: 'File Chain',
				href: '/dashboard/file-chain',
				icon: Link2
			},
			{
				label: 'Audit Logs',
				href: '/dashboard/audit-logs',
				icon: ScrollText
			}
		]
	},
	{
		label: 'Management',
		items: [
			{
				label: 'Storage',
				href: '/dashboard/storage',
				icon: HardDrive
			},
			{
				label: 'User Management',
				href: '/dashboard/user',
				icon: Users,
				children: [
					{ label: 'Trademark', href: '/dashboard/user/trademark' },
					{ label: 'User Roles', href: '/dashboard/user/roles' }
				]
			}
		]
	}
];
