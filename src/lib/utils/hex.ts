/**
 * Converts a hex string into a Uint8Array.
 *
 * @param hex - The hex-encoded string
 * @returns Uint8Array of the decoded bytes
 * @throws {Error} If the hex string has an odd length or contains invalid characters
 */
export function hexToUint8Array(hex: string): Uint8Array {
	if (hex.length % 2 !== 0) {
		throw new Error('Hex string must have an even number of characters');
	}

	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		const byte = parseInt(hex.substring(i, i + 2), 16);
		if (isNaN(byte)) {
			throw new Error(`Invalid hex character at position ${i}`);
		}
		bytes[i / 2] = byte;
	}
	return bytes;
}
