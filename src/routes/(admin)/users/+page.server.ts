import type { PageServerLoad } from './$types';

export interface AdminUser {
	user_id: string;
	first_name: string | null;
	middle_name: string | null;
	last_name: string | null;
	role: string;
	is_active: boolean;
	date_added: string;
	email: string;
	last_active: string | null;
}

interface UsersResponse {
	users: AdminUser[];
	total_count: number;
	page: number;
	page_size: number;
	total_pages: number;
}

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
	const search = url.searchParams.get('search') ?? '';
	const status = url.searchParams.get('status') ?? 'all';
	const sortColumn = url.searchParams.get('sort') ?? 'created_at';
	const sortDirection = url.searchParams.get('dir') ?? 'desc';
	const page = parseInt(url.searchParams.get('page') ?? '1', 10);
	const pageSize = parseInt(url.searchParams.get('pageSize') ?? '10', 10);

	const { data, error } = await supabase.schema('api').rpc('get_users_admin', {
		search_query: search || null,
		status_filter: status,
		sort_column: sortColumn,
		sort_direction: sortDirection,
		page_number: page,
		page_size: pageSize
	});

	if (error) {
		console.error('Error fetching users:', error);
		return {
			users: [] as AdminUser[],
			totalCount: 0,
			page: 1,
			pageSize,
			totalPages: 0,
			search,
			status,
			sortColumn,
			sortDirection
		};
	}

	const result = data as UsersResponse;

	return {
		users: result.users ?? [],
		totalCount: result.total_count,
		page: result.page,
		pageSize: result.page_size,
		totalPages: result.total_pages,
		search,
		status,
		sortColumn,
		sortDirection
	};
};
