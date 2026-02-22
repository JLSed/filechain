/** Convert a hex string to Uint8Array */
export function hexToBytes(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

/** Common MIME-type mappings by extension */
const MIME_MAP: Record<string, string> = {
	pdf: 'application/pdf',
	png: 'image/png',
	jpg: 'image/jpeg',
	jpeg: 'image/jpeg',
	gif: 'image/gif',
	webp: 'image/webp',
	svg: 'image/svg+xml',
	txt: 'text/plain',
	csv: 'text/csv',
	json: 'application/json',
	xml: 'application/xml',
	html: 'text/html',
	md: 'text/markdown',
	doc: 'application/msword',
	docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	xls: 'application/vnd.ms-excel',
	xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

/** Get MIME type from a filename */
export function getMimeType(filename: string): string {
	const ext = filename.split('.').pop()?.toLowerCase() ?? '';
	return MIME_MAP[ext] ?? 'application/octet-stream';
}

/** Check if a MIME type is a PDF */
export function isPdf(mime: string): boolean {
	return mime === 'application/pdf';
}

/** Check if a MIME type is an image */
export function isImage(mime: string): boolean {
	return mime.startsWith('image/');
}

/** Check if a MIME type is text-based */
export function isText(mime: string): boolean {
	return mime.startsWith('text/') || mime === 'application/json' || mime === 'application/xml';
}

/**
 * Strip the `.enc` suffix from a storage filename to get the original name.
 * e.g. "document.pdf.enc" → "document.pdf"
 */
export function stripEncExtension(name: string): string {
	return name.endsWith('.enc') ? name.slice(0, -4) : name;
}
