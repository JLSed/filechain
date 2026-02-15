import type { Actions, PageServerLoad } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import type { FileMetadata } from '$lib/types/file';

/**
 * Load recent files for dashboard display.
 * Fetches the 10 most recently uploaded files.
 */
export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		return { files: [] as FileMetadata[], profile: null };
	}

	// Fetch user profile and recent files in parallel
	const [profileResult, filesResult] = await Promise.all([
		supabase
			.schema('api')
			.from('user_profiles')
			.select('*')
			.eq('user_id', session.user.id)
			.single(),
		supabase
			.schema('api')
			.from('file_metadata')
			.select('file_id, uploader_id, file_name, file_path, file_hash, file_nonce, uploaded_at')
			.eq('uploader_id', session.user.id)
			.order('uploaded_at', { ascending: false })
			.limit(10)
	]);

	if (profileResult.error) {
		console.error('[dashboard/+page.server.ts] Error fetching profile:', profileResult.error);
	}

	if (filesResult.error) {
		console.error('[dashboard/+page.server.ts] Error fetching files:', filesResult.error);
		return { files: [] as FileMetadata[], profile: profileResult.data || null };
	}

	return {
		files: (filesResult.data as FileMetadata[]) ?? [],
		profile: profileResult.data || null
	};
};

export const actions: Actions = {
	logout: async ({ locals: { supabase } }) => {
		const { error } = await supabase.auth.signOut();

		if (error) {
			return fail(500, { message: 'Failed to sign out' });
		}

		redirect(303, '/login');
	}
};
