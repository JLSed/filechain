/* tslint:disable */
/* eslint-disable */

export class BlockSignatureResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly error_message: string;
    readonly signature_hex: string;
    readonly success: boolean;
}

/**
 * Result of file decryption operation
 */
export class DecryptedFileResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly decrypted_data: Uint8Array;
    readonly error_message: string;
    readonly file_hash_hex: string;
    readonly success: boolean;
}

export class DecryptedPrivateKey {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly error_message: string;
    readonly private_key: Uint8Array;
    readonly private_key_hex: string;
    readonly success: boolean;
}

export class EncryptedFileResult {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly dek_nonce_hex: string;
    readonly encrypted_data: Uint8Array;
    readonly encrypted_dek: Uint8Array;
    readonly encrypted_dek_hex: string;
    readonly ephemeral_public_key: Uint8Array;
    readonly ephemeral_public_key_hex: string;
    readonly error_message: string;
    readonly file_nonce_hex: string;
    readonly original_hash_hex: string;
    readonly success: boolean;
}

/**
 * Encrypts a master key using AES-256-GCM
 *
 * # Arguments
 * * `input` - User's input for deriving the encryption key
 * * `salt` - Salt for key derivation
 *
 * # Returns
 * A struct containing the nonce, authentication tag, and encrypted master key
 */
export class EncryptedMasterKey {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    readonly encrypted_private_key: Uint8Array;
    readonly encrypted_private_key_hex: string;
    readonly nonce: Uint8Array;
    readonly nonce_hex: string;
    readonly public_key: Uint8Array;
    readonly public_key_hex: string;
    readonly salt: string;
}

/**
 * Decrypts file data using hybrid decryption (X25519 + AES-256-GCM)
 *
 * The decryption process:
 * 1. Decrypt the user's private key using password-derived key
 * 2. Perform ECDH with the decrypted private key and ephemeral public key to derive the shared secret
 * 3. Decrypt the DEK using the shared secret
 * 4. Decrypt the file using the DEK
 *
 * This function keeps sensitive data (private key) entirely within WASM,
 * never exposing it to the JavaScript frontend.
 *
 * # Arguments
 * * `val` - A serialized `DecryptionContext` object containing all required data
 *
 * # Returns
 * DecryptedFileResult containing decrypted data and its hash for verification
 */
export function decrypt_file(val: any): DecryptedFileResult;

/**
 * Decrypts the user's private key using password-derived key
 *
 * # Arguments
 * * `password` - The user's master password
 * * `salt` - Salt used for key derivation
 * * `encrypted_key` - The encrypted private key bytes (48 bytes: 32 key + 16 auth tag)
 * * `nonce` - The nonce used for encryption (12 bytes)
 *
 * # Returns
 * DecryptedPrivateKey containing the decrypted private key or error message
 */
export function decrypt_private_key(password: string, salt: string, encrypted_key: Uint8Array, nonce: Uint8Array): DecryptedPrivateKey;

/**
 * Encrypts file data using hybrid encryption (X25519 + AES-256-GCM)
 *
 * # Arguments
 * * `file_data` - The raw file bytes to encrypt
 * * `recipient_public_key` - The recipient's X25519 public key (32 bytes)
 *
 * # Returns
 * EncryptedFileResult containing:
 * - encrypted_data: The encrypted file bytes
 * - file_nonce_hex: Nonce used for file encryption
 * - encrypted_dek: The encrypted Data Encryption Key
 * - dek_nonce_hex: Nonce used for DEK encryption
 * - ephemeral_public_key: The ephemeral public key for ECDH
 * - original_hash_hex: SHA-256 hash of the original file
 */
export function encrypt_file(file_data: Uint8Array, recipient_public_key: Uint8Array): EncryptedFileResult;

/**
 * Encrypts file data using hybrid encryption for multiple recipients.
 *
 * # Arguments
 * * `file_data` - The raw file bytes to encrypt
 * * `recipients_js` - A JsValue representing an array of { user_id: string, public_key: number[] }
 *
 * # Returns
 * A JsValue containing MultiKeyEncryptResultData with encrypted file and per-recipient DEK entries.
 */
export function encrypt_file_multi(file_data: Uint8Array, recipients_js: any): any;

export function encrypt_master_key(input: string): EncryptedMasterKey;

/**
 * Generates a SHA-256 block signature for a file ledger entry.
 *
 * # Arguments
 * * `uploader_id` - The UUID of the uploader
 * * `timestamp_ms` - Unix timestamp in milliseconds (from Date.now())
 * * `file_hash` - The SHA-256 hash hex of the original file
 * * `previous_block_hash` - The signature of the previous block, or "0" for genesis
 *
 * # Returns
 * BlockSignatureResult containing the hex-encoded SHA-256 signature
 */
export function generate_block_signature(uploader_id: string, timestamp_ms: number, file_hash: string, previous_block_hash: string): BlockSignatureResult;

export function generate_nonce_hex(): string;

export function greet(): void;

export function master_key_bytes_to_hex(input: string, salt: string): string;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_encryptedfileresult_free: (a: number, b: number) => void;
    readonly encrypt_file: (a: number, b: number, c: number, d: number) => number;
    readonly encrypt_file_multi: (a: number, b: number, c: any) => any;
    readonly encryptedfileresult_dek_nonce_hex: (a: number) => [number, number];
    readonly encryptedfileresult_encrypted_data: (a: number) => [number, number];
    readonly encryptedfileresult_encrypted_dek: (a: number) => [number, number];
    readonly encryptedfileresult_encrypted_dek_hex: (a: number) => [number, number];
    readonly encryptedfileresult_ephemeral_public_key: (a: number) => [number, number];
    readonly encryptedfileresult_ephemeral_public_key_hex: (a: number) => [number, number];
    readonly encryptedfileresult_error_message: (a: number) => [number, number];
    readonly encryptedfileresult_file_nonce_hex: (a: number) => [number, number];
    readonly encryptedfileresult_original_hash_hex: (a: number) => [number, number];
    readonly encryptedfileresult_success: (a: number) => number;
    readonly __wbg_decryptedfileresult_free: (a: number, b: number) => void;
    readonly decrypt_file: (a: any) => number;
    readonly decryptedfileresult_decrypted_data: (a: number) => [number, number];
    readonly decryptedfileresult_error_message: (a: number) => [number, number];
    readonly decryptedfileresult_file_hash_hex: (a: number) => [number, number];
    readonly decryptedfileresult_success: (a: number) => number;
    readonly __wbg_blocksignatureresult_free: (a: number, b: number) => void;
    readonly blocksignatureresult_error_message: (a: number) => [number, number];
    readonly blocksignatureresult_signature_hex: (a: number) => [number, number];
    readonly blocksignatureresult_success: (a: number) => number;
    readonly generate_block_signature: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => number;
    readonly generate_nonce_hex: () => [number, number];
    readonly master_key_bytes_to_hex: (a: number, b: number, c: number, d: number) => [number, number];
    readonly greet: () => void;
    readonly __wbg_encryptedmasterkey_free: (a: number, b: number) => void;
    readonly encrypt_master_key: (a: number, b: number) => number;
    readonly encryptedmasterkey_encrypted_private_key: (a: number) => [number, number];
    readonly encryptedmasterkey_encrypted_private_key_hex: (a: number) => [number, number];
    readonly encryptedmasterkey_nonce: (a: number) => [number, number];
    readonly encryptedmasterkey_nonce_hex: (a: number) => [number, number];
    readonly encryptedmasterkey_public_key: (a: number) => [number, number];
    readonly encryptedmasterkey_public_key_hex: (a: number) => [number, number];
    readonly encryptedmasterkey_salt: (a: number) => [number, number];
    readonly __wbg_decryptedprivatekey_free: (a: number, b: number) => void;
    readonly decrypt_private_key: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => number;
    readonly decryptedprivatekey_error_message: (a: number) => [number, number];
    readonly decryptedprivatekey_private_key: (a: number) => [number, number];
    readonly decryptedprivatekey_private_key_hex: (a: number) => [number, number];
    readonly decryptedprivatekey_success: (a: number) => number;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
