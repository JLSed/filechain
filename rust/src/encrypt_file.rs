/// The encryption process:
/// 1. Generate a random DEK (Data Encryption Key)
/// 2. Encrypt the file using the DEK with AES-256-GCM
/// 3. For each recipient:
///    a. Generate an ephemeral X25519 key pair
///    b. Perform ECDH with recipient's public key to derive a shared secret
///    c. Encrypt the DEK using the shared secret with AES-256-GCM

use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, OsRng, generic_array::GenericArray}
};
use x25519_dalek::{PublicKey, StaticSecret};
use serde::{Serialize, Deserialize};

pub use crate::{generate_nonce, bytes_to_hex, hash_file, log};

#[wasm_bindgen]
pub struct EncryptedFileResult {
    success: bool,
    encrypted_data: Vec<u8>,
    file_nonce_hex: String,
    encrypted_dek: Vec<u8>,
    dek_nonce_hex: String,
    ephemeral_public_key: Vec<u8>,
    original_hash_hex: String,
    error_message: String,
}

/// Encrypts file data using hybrid encryption (X25519 + AES-256-GCM)
/// 
/// # Arguments
/// * `file_data` - The raw file bytes to encrypt
/// * `recipient_public_key` - The recipient's X25519 public key (32 bytes)
/// 
/// # Returns
/// EncryptedFileResult containing:
/// - encrypted_data: The encrypted file bytes
/// - file_nonce_hex: Nonce used for file encryption
/// - encrypted_dek: The encrypted Data Encryption Key
/// - dek_nonce_hex: Nonce used for DEK encryption
/// - ephemeral_public_key: The ephemeral public key for ECDH
/// - original_hash_hex: SHA-256 hash of the original file
#[wasm_bindgen]
pub fn encrypt_file(
    file_data: &[u8], 
    recipient_public_key: &[u8],
) -> EncryptedFileResult {
    log("[encrypt_file] Starting file encryption...");
    log(&format!("[encrypt_file] File size: {} bytes", file_data.len()));

    // Validate recipient's public key length
    if recipient_public_key.len() != 32 {
        log(&format!("[encrypt_file] Invalid public key length: {}", recipient_public_key.len()));
        return EncryptedFileResult {
            success: false,
            encrypted_data: vec![],
            file_nonce_hex: String::new(),
            encrypted_dek: vec![],
            dek_nonce_hex: String::new(),
            ephemeral_public_key: vec![],
            original_hash_hex: String::new(),
            error_message: format!("Public key must be 32 bytes, got {}", recipient_public_key.len()),
        };
    }

    let recipient_public_key_array: [u8; 32] = recipient_public_key.try_into().unwrap();
    let recipient_public = PublicKey::from(recipient_public_key_array);

    // Generate a random DEK
    log("[encrypt_file] Generating random DEK...");
    let dek_secret = StaticSecret::random_from_rng(OsRng);
    let dek: [u8; 32] = dek_secret.to_bytes();
    log(&format!("[encrypt_file] DEK generated: {}", bytes_to_hex(&dek)));

    log("[encrypt_file] Computing original file hash...");
    let original_hash = hash_file(file_data);

    // Encrypt the file using the DEK
    log("[encrypt_file] Encrypting file with DEK...");
    let file_nonce = generate_nonce();
    let file_nonce_hex = bytes_to_hex(file_nonce.as_slice());
    log(&format!("[encrypt_file] File nonce: {}", file_nonce_hex));

    let dek_key = GenericArray::from_slice(&dek);
    let file_cipher = Aes256Gcm::new(dek_key);
    let file_nonce_ga = Nonce::from_slice(file_nonce.as_slice());

    let encrypted_file_data = match file_cipher.encrypt(file_nonce_ga, file_data) {
        Ok(encrypted) => {
            log(&format!("[encrypt_file] File encrypted! Size: {} bytes", encrypted.len()));
            encrypted
        }
        Err(e) => {
            log(&format!("[encrypt_file] File encryption failed: {}", e));
            return EncryptedFileResult {
                success: false,
                encrypted_data: vec![],
                file_nonce_hex: String::new(),
                encrypted_dek: vec![],
                dek_nonce_hex: String::new(),
                ephemeral_public_key: vec![],
                original_hash_hex: String::new(),
                error_message: format!("File encryption failed: {}", e),
            };
        }
    };

    // Generate ephemeral key pair and perform ECDH
    log("[encrypt_file] Generating ephemeral key pair for ECDH...");
    let ephemeral_secret = StaticSecret::random_from_rng(OsRng);
    let ephemeral_public = PublicKey::from(&ephemeral_secret);
    log(&format!("[encrypt_file] Ephemeral public key: {}", bytes_to_hex(ephemeral_public.as_bytes())));

    // Derive shared secret using ECDH
    let shared_secret = ephemeral_secret.diffie_hellman(&recipient_public);
    log("[encrypt_file] Shared secret derived via ECDH");

    // Encrypt the DEK using the shared secret
    log("[encrypt_file] Encrypting DEK with shared secret...");
    let dek_nonce = generate_nonce();
    let dek_nonce_hex = bytes_to_hex(dek_nonce.as_slice());
    log(&format!("[encrypt_file] DEK nonce: {}", dek_nonce_hex));

    let shared_key = GenericArray::from_slice(shared_secret.as_bytes());
    let dek_cipher = Aes256Gcm::new(shared_key);
    let dek_nonce_ga = Nonce::from_slice(dek_nonce.as_slice());

    let encrypted_dek = match dek_cipher.encrypt(dek_nonce_ga, dek.as_ref()) {
        Ok(encrypted) => {
            log(&format!("[encrypt_file] DEK encrypted! Size: {} bytes", encrypted.len()));
            encrypted
        }
        Err(e) => {
            log(&format!("[encrypt_file] DEK encryption failed: {}", e));
            return EncryptedFileResult {
                success: false,
                encrypted_data: vec![],
                file_nonce_hex: String::new(),
                encrypted_dek: vec![],
                dek_nonce_hex: String::new(),
                ephemeral_public_key: vec![],
                original_hash_hex: String::new(),
                error_message: format!("DEK encryption failed: {}", e),
            };
        }
    };

    log("[encrypt_file] Encryption complete!");
    EncryptedFileResult {
        success: true,
        encrypted_data: encrypted_file_data,
        file_nonce_hex,
        encrypted_dek,
        dek_nonce_hex,
        ephemeral_public_key: ephemeral_public.as_bytes().to_vec(),
        original_hash_hex: original_hash,
        error_message: String::new(),
    }
}

#[wasm_bindgen]
impl EncryptedFileResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_data(&self) -> Vec<u8> {
        self.encrypted_data.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn file_nonce_hex(&self) -> String {
        self.file_nonce_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_dek(&self) -> Vec<u8> {
        self.encrypted_dek.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_dek_hex(&self) -> String {
        bytes_to_hex(&self.encrypted_dek)
    }

    #[wasm_bindgen(getter)]
    pub fn dek_nonce_hex(&self) -> String {
        self.dek_nonce_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn ephemeral_public_key(&self) -> Vec<u8> {
        self.ephemeral_public_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn ephemeral_public_key_hex(&self) -> String {
        bytes_to_hex(&self.ephemeral_public_key)
    }

    #[wasm_bindgen(getter)]
    pub fn original_hash_hex(&self) -> String {
        self.original_hash_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

// --- Multi-key encryption ---

/// Input for a single recipient in multi-key encryption.
/// Passed from JavaScript via serde.
#[derive(Deserialize)]
pub struct RecipientInput {
    pub user_id: String,
    pub public_key: Vec<u8>,
}

/// A single encrypted DEK entry for one recipient.
#[derive(Serialize)]
pub struct EncryptedDekEntry {
    pub user_id: String,
    pub encrypted_dek_hex: String,
    pub dek_nonce_hex: String,
    pub ephemeral_public_key_hex: String,
}

/// Result of multi-key file encryption.
#[derive(Serialize)]
pub struct MultiKeyEncryptResultData {
    pub success: bool,
    pub encrypted_data: Vec<u8>,
    pub file_nonce_hex: String,
    pub original_hash_hex: String,
    pub dek_entries: Vec<EncryptedDekEntry>,
    pub error_message: String,
}

/// Encrypts file data using hybrid encryption for multiple recipients.
///
/// # Arguments
/// * `file_data` - The raw file bytes to encrypt
/// * `recipients_js` - A JsValue representing an array of { user_id: string, public_key: number[] }
///
/// # Returns
/// A JsValue containing MultiKeyEncryptResultData with encrypted file and per-recipient DEK entries.
#[wasm_bindgen]
pub fn encrypt_file_multi(
    file_data: &[u8],
    recipients_js: JsValue,
) -> JsValue {
    log("[encrypt_file_multi] Starting multi-key file encryption...");
    log(&format!("[encrypt_file_multi] File size: {} bytes", file_data.len()));

    // Deserialize recipients from JS
    let recipients: Vec<RecipientInput> = match serde_wasm_bindgen::from_value(recipients_js) {
        Ok(r) => r,
        Err(e) => {
            let result = MultiKeyEncryptResultData {
                success: false,
                encrypted_data: vec![],
                file_nonce_hex: String::new(),
                original_hash_hex: String::new(),
                dek_entries: vec![],
                error_message: format!("Failed to parse recipients: {}", e),
            };
            return serde_wasm_bindgen::to_value(&result).unwrap();
        }
    };

    log(&format!("[encrypt_file_multi] {} recipients", recipients.len()));

    if recipients.is_empty() {
        let result = MultiKeyEncryptResultData {
            success: false,
            encrypted_data: vec![],
            file_nonce_hex: String::new(),
            original_hash_hex: String::new(),
            dek_entries: vec![],
            error_message: "At least one recipient is required".to_string(),
        };
        return serde_wasm_bindgen::to_value(&result).unwrap();
    }

    // Validate all public keys
    for (i, recipient) in recipients.iter().enumerate() {
        if recipient.public_key.len() != 32 {
            log(&format!(
                "[encrypt_file_multi] Invalid public key length for recipient {}: {}",
                i, recipient.public_key.len()
            ));
            let result = MultiKeyEncryptResultData {
                success: false,
                encrypted_data: vec![],
                file_nonce_hex: String::new(),
                original_hash_hex: String::new(),
                dek_entries: vec![],
                error_message: format!(
                    "Public key for user {} must be 32 bytes, got {}",
                    recipient.user_id, recipient.public_key.len()
                ),
            };
            return serde_wasm_bindgen::to_value(&result).unwrap();
        }
    }

    // Generate a random DEK
    log("[encrypt_file_multi] Generating random DEK...");
    let dek_secret = StaticSecret::random_from_rng(OsRng);
    let dek: [u8; 32] = dek_secret.to_bytes();

    log("[encrypt_file_multi] Computing original file hash...");
    let original_hash = hash_file(file_data);

    // Encrypt the file using the DEK
    log("[encrypt_file_multi] Encrypting file with DEK...");
    let file_nonce = generate_nonce();
    let file_nonce_hex = bytes_to_hex(file_nonce.as_slice());

    let dek_key = GenericArray::from_slice(&dek);
    let file_cipher = Aes256Gcm::new(dek_key);
    let file_nonce_ga = Nonce::from_slice(file_nonce.as_slice());

    let encrypted_file_data = match file_cipher.encrypt(file_nonce_ga, file_data) {
        Ok(encrypted) => {
            log(&format!("[encrypt_file_multi] File encrypted! Size: {} bytes", encrypted.len()));
            encrypted
        }
        Err(e) => {
            let result = MultiKeyEncryptResultData {
                success: false,
                encrypted_data: vec![],
                file_nonce_hex: String::new(),
                original_hash_hex: String::new(),
                dek_entries: vec![],
                error_message: format!("File encryption failed: {}", e),
            };
            return serde_wasm_bindgen::to_value(&result).unwrap();
        }
    };

    // Encrypt the DEK for each recipient
    let mut dek_entries: Vec<EncryptedDekEntry> = Vec::with_capacity(recipients.len());

    for (i, recipient) in recipients.iter().enumerate() {
        log(&format!(
            "[encrypt_file_multi] Encrypting DEK for recipient {} (user: {})...",
            i, recipient.user_id
        ));

        let pk_array: [u8; 32] = recipient.public_key.as_slice().try_into().unwrap();
        let recipient_public = PublicKey::from(pk_array);

        // Generate ephemeral key pair for this recipient
        let ephemeral_secret = StaticSecret::random_from_rng(OsRng);
        let ephemeral_public = PublicKey::from(&ephemeral_secret);

        // Derive shared secret via ECDH
        let shared_secret = ephemeral_secret.diffie_hellman(&recipient_public);

        // Encrypt the DEK with the shared secret
        let dek_nonce = generate_nonce();
        let dek_nonce_hex = bytes_to_hex(dek_nonce.as_slice());

        let shared_key = GenericArray::from_slice(shared_secret.as_bytes());
        let dek_cipher = Aes256Gcm::new(shared_key);
        let dek_nonce_ga = Nonce::from_slice(dek_nonce.as_slice());

        let encrypted_dek = match dek_cipher.encrypt(dek_nonce_ga, dek.as_ref()) {
            Ok(encrypted) => encrypted,
            Err(e) => {
                let result = MultiKeyEncryptResultData {
                    success: false,
                    encrypted_data: vec![],
                    file_nonce_hex: String::new(),
                    original_hash_hex: String::new(),
                    dek_entries: vec![],
                    error_message: format!(
                        "DEK encryption failed for user {}: {}",
                        recipient.user_id, e
                    ),
                };
                return serde_wasm_bindgen::to_value(&result).unwrap();
            }
        };

        dek_entries.push(EncryptedDekEntry {
            user_id: recipient.user_id.clone(),
            encrypted_dek_hex: bytes_to_hex(&encrypted_dek),
            dek_nonce_hex,
            ephemeral_public_key_hex: bytes_to_hex(ephemeral_public.as_bytes()),
        });
    }

    log(&format!(
        "[encrypt_file_multi] Encryption complete! {} DEK entries created.",
        dek_entries.len()
    ));

    let result = MultiKeyEncryptResultData {
        success: true,
        encrypted_data: encrypted_file_data,
        file_nonce_hex,
        original_hash_hex: original_hash,
        dek_entries,
        error_message: String::new(),
    };

    serde_wasm_bindgen::to_value(&result).unwrap()
}
