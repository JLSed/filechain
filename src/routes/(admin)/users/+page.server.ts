import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { createAdminClient } from '$lib/services/supabase/admin';

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

export const actions: Actions = {
	createUser: async ({ request, url }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const firstName = formData.get('first_name') as string;
		const middleName = (formData.get('middle_name') as string) || null;
		const lastName = formData.get('last_name') as string;
		const role = formData.get('role') as string;

		if (!email || !password || !firstName || !lastName) {
			return fail(400, { message: 'Email, first name, last name, and password are required.' });
		}

		if (!['user', 'admin'].includes(role)) {
			return fail(400, { message: 'Invalid role.' });
		}

		const adminClient = createAdminClient();

		// 1. Create the auth user with Supabase Admin API
		const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
			email,
			password,
			email_confirm: false,
			user_metadata: { first_name: firstName, last_name: lastName }
		});

		if (authError) {
			console.error('Error creating auth user:', authError);
			return fail(400, { message: authError.message, email });
		}

		// 2. Insert the user profile via a SECURITY DEFINER function (bypasses RLS on the view)
		const { error: profileError } = await adminClient
			.schema('api')
			.rpc('admin_create_user_profile', {
				p_user_id: authData.user.id,
				p_first_name: firstName,
				p_middle_name: middleName,
				p_last_name: lastName,
				p_role: role
			});

		if (profileError) {
			console.error('Error creating user profile:', profileError);
			// Clean up the auth user if profile creation fails
			await adminClient.auth.admin.deleteUser(authData.user.id);
			return fail(500, { message: 'Failed to create user profile.' });
		}

		// 3. Supabase sends the default confirmation email automatically
		// (email_confirm: false triggers the email from your Supabase dashboard template)

		return { success: true, message: `User ${email} created successfully.` };
	}
};
