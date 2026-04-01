const PDF_TYPES = ['application/pdf'];
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
const TEXT_TYPES = [
	'text/plain',
	'text/html',
	'text/css',
	'text/csv',
	'text/xml',
	'application/json',
	'application/xml',
	'application/javascript'
];

export function isPdf(mimeType: string): boolean {
	return PDF_TYPES.includes(mimeType);
}

export function isImage(mimeType: string): boolean {
	return IMAGE_TYPES.includes(mimeType);
}

export function isText(mimeType: string): boolean {
	return TEXT_TYPES.includes(mimeType);
}

/**
 * Maps a file extension to its MIME type.
 * Falls back to 'application/octet-stream' for unknown extensions.
 */
export function getMimeType(fileName: string): string {
	const ext = fileName.split('.').pop()?.toLowerCase() ?? '';

	const mimeMap: Record<string, string> = {
		pdf: 'application/pdf',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		webp: 'image/webp',
		svg: 'image/svg+xml',
		txt: 'text/plain',
		html: 'text/html',
		css: 'text/css',
		csv: 'text/csv',
		xml: 'text/xml',
		json: 'application/json',
		js: 'application/javascript',
		ts: 'application/javascript',
		doc: 'application/msword',
		docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		xls: 'application/vnd.ms-excel',
		xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
		ppt: 'application/vnd.ms-powerpoint',
		pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
		zip: 'application/zip',
		rar: 'application/x-rar-compressed'
	};

	return mimeMap[ext] ?? 'application/octet-stream';
}
