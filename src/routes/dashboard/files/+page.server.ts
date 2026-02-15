import type { PageServerLoad } from './$types';
import type { FileMetadata } from '$lib/types/file';

/**
 * Loads files belonging to the currently authenticated user.
 *
 * Queries the `api.file_metadata` table and returns them ordered
 * by upload date (newest first).
 */
export const load: PageServerLoad = async ({ locals: { supabase, session } }) => {
	if (!session) {
		return { files: [] as FileMetadata[] };
	}

	const { data, error } = await supabase
		.schema('api')
		.from('file_metadata')
		.select('file_id, uploader_id, file_name, file_path, file_hash, file_nonce, uploaded_at')
		.eq('uploader_id', session.user.id)
		.order('uploaded_at', { ascending: false });

	if (error) {
		console.error('[files/+page.server.ts] Error fetching files:', error);
		return { files: [] as FileMetadata[] };
	}

	return { files: (data as FileMetadata[]) ?? [] };
};
