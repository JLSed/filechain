/** Map of file extensions to MIME types */
const MIME_MAP: Record<string, string> = {
	pdf: 'application/pdf',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	svg: 'image/svg+xml',
	txt: 'text/plain',
	csv: 'text/csv',
	json: 'application/json',
	xml: 'application/xml',
	html: 'text/html'
};

/**
 * Determines the MIME type based on file extension.
 *
 * @param fileName - The name of the file
 * @returns The corresponding MIME type string
 */
export function getMimeType(fileName: string): string {
	const dotIndex = fileName.lastIndexOf('.');
	if (dotIndex === -1) return 'application/octet-stream';

	const ext = fileName.substring(dotIndex + 1).toLowerCase();
	return MIME_MAP[ext] ?? 'application/octet-stream';
}

/**
 * Checks if a MIME type represents a PDF.
 */
export function isPdf(mimeType: string): boolean {
	return mimeType === 'application/pdf';
}

/**
 * Checks if a MIME type represents an image.
 */
export function isImage(mimeType: string): boolean {
	return mimeType.startsWith('image/');
}

/**
 * Checks if a MIME type represents viewable text content.
 */
export function isText(mimeType: string): boolean {
	return (
		mimeType.startsWith('text/') ||
		mimeType === 'application/json' ||
		mimeType === 'application/xml'
	);
}

/**
 * Strips the `.encrypted` extension from a file name if present.
 *
 * @param fileName - The file name to process
 * @returns The display-friendly file name
 */
export function getDisplayName(fileName: string): string {
	return fileName.endsWith('.encrypted') ? fileName.slice(0, -10) : fileName;
}
