use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, Nonce, aead::{Aead, KeyInit, OsRng, generic_array::GenericArray}
};
use argon2::password_hash::SaltString;

pub use crate::{get_key_encryption_key, generate_nonce, bytes_to_hex, log};

#[wasm_bindgen]
pub struct DecryptedPrivateKey {
    success: bool,
    private_key: Vec<u8>,
    error_message: String,
}

#[wasm_bindgen]
pub struct ReEncryptedPrivateKey {
    success: bool,
    encrypted_private_key: Vec<u8>,
    salt: String,
    nonce: Vec<u8>,
    error_message: String,
}

/// Decrypts the user's private key using password-derived key
/// 
/// # Arguments
/// * `password` - The user's master password
/// * `salt` - Salt used for key derivation
/// * `encrypted_key` - The encrypted private key bytes (48 bytes: 32 key + 16 auth tag)
/// * `nonce` - The nonce used for encryption (12 bytes)
/// 
/// # Returns
/// DecryptedPrivateKey containing the decrypted private key or error message
#[wasm_bindgen]
pub fn decrypt_private_key(
    password: &str,
    salt: &str,
    encrypted_key: &[u8],
    nonce: &[u8],
) -> DecryptedPrivateKey {
    log("Starting private key decryption...");

    // Validate nonce length
    if nonce.len() != 12 {
        log(&format!("Invalid nonce length: {}", nonce.len()));
        return DecryptedPrivateKey {
            success: false,
            private_key: vec![],
            error_message: format!("Nonce must be 12 bytes, got {}", nonce.len()),
        };
    }

    // The encrypted_key should be 48 bytes (32 bytes key + 16 bytes auth tag)
    if encrypted_key.len() != 48 {
        log(&format!("Invalid encrypted key length: {}", encrypted_key.len()));
        return DecryptedPrivateKey {
            success: false,
            private_key: vec![],
            error_message: format!("Encrypted key must be 48 bytes, got {}", encrypted_key.len()),
        };
    }

    // Derive the encryption key from password and salt (includes paminta internally)
    log("Deriving encryption key from password...");
    let encryption_key = get_key_encryption_key(password, salt);

    // Create the cipher
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = Nonce::from_slice(nonce);

    // Decrypt the private key
    log("Attempting decryption...");
    match cipher.decrypt(nonce, encrypted_key) {
        Ok(decrypted) => {
            log("Decryption successful!");
            // Private key is intentionally not logged for security
            DecryptedPrivateKey {
                success: true,
                private_key: decrypted,
                error_message: String::new(),
            }
        }
        Err(_) => {
            log("Decryption failed - invalid password or corrupted data");
            DecryptedPrivateKey {
                success: false,
                private_key: vec![],
                error_message: "Decryption failed. Please check your password.".to_string(),
            }
        }
    }
}

#[wasm_bindgen]
pub fn re_encrypt_private_key(
    old_password: &str,
    old_salt: &str,
    encrypted_key: &[u8],
    old_nonce: &[u8],
    new_password: &str,
) -> ReEncryptedPrivateKey {
    if old_nonce.len() != 12 {
        return ReEncryptedPrivateKey {
            success: false,
            encrypted_private_key: vec![],
            salt: String::new(),
            nonce: vec![],
            error_message: format!("Nonce must be 12 bytes, got {}", old_nonce.len()),
        };
    }

    if encrypted_key.len() != 48 {
        return ReEncryptedPrivateKey {
            success: false,
            encrypted_private_key: vec![],
            salt: String::new(),
            nonce: vec![],
            error_message: format!("Encrypted key must be 48 bytes, got {}", encrypted_key.len()),
        };
    }

    let old_encryption_key = get_key_encryption_key(old_password, old_salt);
    let old_key = GenericArray::from_slice(&old_encryption_key);
    let old_cipher = Aes256Gcm::new(old_key);
    let old_nonce = Nonce::from_slice(old_nonce);

    let decrypted_private_key = match old_cipher.decrypt(old_nonce, encrypted_key) {
        Ok(decrypted) => decrypted,
        Err(_) => {
            return ReEncryptedPrivateKey {
                success: false,
                encrypted_private_key: vec![],
                salt: String::new(),
                nonce: vec![],
                error_message: "Current password is incorrect".to_string(),
            };
        }
    };

    let new_salt = SaltString::generate(&mut OsRng);
    let new_encryption_key = get_key_encryption_key(new_password, new_salt.as_str());
    let new_key = GenericArray::from_slice(&new_encryption_key);
    let new_cipher = Aes256Gcm::new(new_key);
    let new_nonce = generate_nonce();

    let encrypted_private_key = match new_cipher.encrypt(&new_nonce, decrypted_private_key.as_ref()) {
        Ok(ciphertext) => ciphertext,
        Err(_) => {
            return ReEncryptedPrivateKey {
                success: false,
                encrypted_private_key: vec![],
                salt: String::new(),
                nonce: vec![],
                error_message: "Failed to encrypt private key with new password.".to_string(),
            };
        }
    };

    ReEncryptedPrivateKey {
        success: true,
        encrypted_private_key,
        salt: new_salt.as_str().to_string(),
        nonce: new_nonce.to_vec(),
        error_message: String::new(),
    }
}


#[wasm_bindgen]
impl DecryptedPrivateKey {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn private_key(&self) -> Vec<u8> {
        self.private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn private_key_hex(&self) -> String {
        if self.success {
            bytes_to_hex(&self.private_key)
        } else {
            String::new()
        }
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}

#[wasm_bindgen]
impl ReEncryptedPrivateKey {
    #[wasm_bindgen(getter)]
    pub fn success(&self) -> bool {
        self.success
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key(&self) -> Vec<u8> {
        self.encrypted_private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key_hex(&self) -> String {
        if self.success {
            bytes_to_hex(&self.encrypted_private_key)
        } else {
            String::new()
        }
    }

    #[wasm_bindgen(getter)]
    pub fn salt(&self) -> String {
        self.salt.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        if self.success {
            bytes_to_hex(&self.nonce)
        } else {
            String::new()
        }
    }

    #[wasm_bindgen(getter)]
    pub fn error_message(&self) -> String {
        self.error_message.clone()
    }
}