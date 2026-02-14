export const pageTitles: Record<string, string> = {
	'/dashboard': 'Dashboard',
	'/dashboard/files': 'Files'
};

// ── 3. Route protection ──
export const protectedRoutes = ['/dashboard', '/files', '/settings', '/account'];
export const authRoutes = ['/login', '/register', '/auth'];
