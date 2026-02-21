import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export interface StorageFile {
	name: string;
	id: string | null;
	size: number;
	created_at: string | null;
	updated_at: string | null;
	/** Whether this is a metadata sidecar (.meta.json) */
	isMeta: boolean;
}

/**
 * GET /patenting/client/files?path=files/202621200...
 *
 * Lists all files stored in the Supabase `storage` bucket
 * under the given folder path.
 */
export const GET: RequestHandler = async ({ locals: { supabase }, url }) => {
	const folderPath = url.searchParams.get('path');

	if (!folderPath) {
		throw error(400, 'Missing "path" query parameter');
	}

	const { data, error: listError } = await supabase.storage.from('storage').list(folderPath, {
		limit: 200,
		sortBy: { column: 'name', order: 'asc' }
	});

	if (listError) {
		console.error('Storage list error:', listError);
		throw error(500, 'Failed to list files');
	}

	const files: StorageFile[] = (data ?? [])
		.filter((f) => f.name !== '.emptyFolderPlaceholder')
		.map((f) => ({
			name: f.name,
			id: f.id ?? null,
			size: f.metadata?.size ?? 0,
			created_at: f.created_at ?? null,
			updated_at: f.updated_at ?? null,
			isMeta: f.name.endsWith('.meta.json')
		}));

	return json({ files });
};
