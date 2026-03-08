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
	/** Original (unencrypted) file size from file_metadata */
	originalSize: number | null;
	/** SHA-256 hash of the original file */
	fileHash: string | null;
	/** Latest upload timestamp from file_metadata */
	uploadedAt: string | null;
	/** Latest revision sequence number from file_ledger */
	latestVersion: number | null;
}

/**
 * GET /patenting/client/files?path=files/202621200...
 *
 * Lists all files stored in the Supabase `storage` bucket
 * under the given folder path, enriched with latest version
 * metadata from the database.
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

	// Fetch latest file_metadata for files in this folder
	const { data: metadataRows } = await supabase
		.schema('api')
		.from('file_metadata')
		.select('file_id, file_name, file_hash, uploaded_at, size')
		.ilike('file_path', `${folderPath}/%`)
		.order('uploaded_at', { ascending: false });

	// Build map: original file name → latest metadata (first match per name wins since ordered DESC)
	const metadataMap = new Map<string, typeof metadataRows extends (infer R)[] | null ? R : never>();
	for (const row of metadataRows ?? []) {
		if (!metadataMap.has(row.file_name)) {
			metadataMap.set(row.file_name, row);
		}
	}

	// Fetch latest ledger sequence per file_id
	const fileIds = [...metadataMap.values()].map((m) => m.file_id);
	const sequenceMap = new Map<string, number>();
	if (fileIds.length > 0) {
		const { data: ledgerRows } = await supabase
			.schema('api')
			.from('file_ledger')
			.select('file_id, sequence')
			.in('file_id', fileIds)
			.order('sequence', { ascending: false });

		for (const row of ledgerRows ?? []) {
			if (!sequenceMap.has(row.file_id)) {
				sequenceMap.set(row.file_id, row.sequence);
			}
		}
	}

	const files: StorageFile[] = (data ?? [])
		.filter((f) => f.name !== '.emptyFolderPlaceholder')
		.map((f) => {
			const originalName = f.name.replace(/\.(enc|encrypted)$/, '');
			const meta = metadataMap.get(originalName);
			return {
				name: f.name,
				id: f.id ?? null,
				size: f.metadata?.size ?? 0,
				created_at: f.created_at ?? null,
				updated_at: f.updated_at ?? null,
				isMeta: f.name.endsWith('.meta.json'),
				originalSize: meta?.size ?? null,
				fileHash: meta?.file_hash ?? null,
				uploadedAt: meta?.uploaded_at ?? null,
				latestVersion: meta ? (sequenceMap.get(meta.file_id) ?? 0) : null
			};
		});

	return json({ files });
};
