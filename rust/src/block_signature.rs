/// Generates a SHA-256 block signature for file ledger entries.
///
/// The signature is computed by hashing the concatenation of:
///   "{uploader_id}-{timestamp_ms}-{file_hash}-{previous_block_hash}"
///
/// For genesis blocks (no previous entry), previous_block_hash should be "0".

use wasm_bindgen::prelude::*;
use sha2::{Sha256, Digest};

pub use crate::{bytes_to_hex, log};

#[wasm_bindgen]
pub struct BlockSignatureResult {
    success: bool,
    signature_hex: String,
    error_message: String,
}

#[wasm_bindgen]
impl BlockSignatureResult {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn signature_hex(&self) -> String {
        self.signature_hex.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

/// Generates a SHA-256 block signature for a file ledger entry.
///
/// # Arguments
/// * `uploader_id` - The UUID of the uploader
/// * `timestamp_ms` - Unix timestamp in milliseconds (from Date.now())
/// * `file_hash` - The SHA-256 hash hex of the original file
/// * `previous_block_hash` - The signature of the previous block, or "0" for genesis
///
/// # Returns
/// BlockSignatureResult containing the hex-encoded SHA-256 signature
#[wasm_bindgen]
pub fn generate_block_signature(
    uploader_id: &str,
    timestamp_ms: f64,
    file_hash: &str,
    previous_block_hash: &str,
) -> BlockSignatureResult {
    log("[block_signature] Generating block signature...");

    if uploader_id.is_empty() {
        return BlockSignatureResult {
            success: false,
            signature_hex: String::new(),
            error_message: "Uploader ID cannot be empty".to_string(),
        };
    }

    if file_hash.is_empty() {
        return BlockSignatureResult {
            success: false,
            signature_hex: String::new(),
            error_message: "File hash cannot be empty".to_string(),
        };
    }

    // Convert f64 timestamp to integer milliseconds
    let ts = timestamp_ms as u64;

    let prev = if previous_block_hash.is_empty() {
        "0"
    } else {
        previous_block_hash
    };

    let input = format!("{}-{}-{}-{}", uploader_id, ts, file_hash, prev);
    log(&format!("[block_signature] Hash input: {}", input));

    let mut hasher = Sha256::new();
    hasher.update(input.as_bytes());
    let result = hasher.finalize();
    let signature = bytes_to_hex(&result);

    log(&format!("[block_signature] Signature: {}", signature));

    BlockSignatureResult {
        success: true,
        signature_hex: signature,
        error_message: String::new(),
    }
}
