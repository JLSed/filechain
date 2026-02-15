/**
 * Extracts the relative storage path from a full public URL or path.
 *
 * The file_path in DB may be a full public URL or a relative path.
 * This function normalizes it for use with the Supabase storage API.
 *
 * @param filePath - The file path from the database
 * @returns The relative storage path
 */
export function extractStoragePath(filePath: string): string {
	const publicPrefix = '/storage/v1/object/public/storage/';
	const idx = filePath.indexOf(publicPrefix);
	if (idx !== -1) {
		return filePath.substring(idx + publicPrefix.length);
	}

	if (filePath.startsWith('storage/')) {
		return filePath.substring('storage/'.length);
	}

	return filePath;
}
