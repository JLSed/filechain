use wasm_bindgen::prelude::*;
use aes_gcm::{
    Aes256Gcm, aead::{Aead, KeyInit, OsRng, generic_array::GenericArray}
};
use x25519_dalek::{PublicKey, StaticSecret};
use argon2::{password_hash::SaltString};
pub use crate::{generate_nonce, get_key_encryption_key, bytes_to_hex, alert, log};


/// Encrypts a master key using AES-256-GCM
/// 
/// # Arguments
/// * `input` - User's input for deriving the encryption key
/// * `salt` - Salt for key derivation
/// 
/// # Returns
/// A struct containing the nonce, authentication tag, and encrypted master key
#[wasm_bindgen]
pub struct EncryptedMasterKey {
    nonce: Vec<u8>,
    salt: String,
    encrypted_private_key: Vec<u8>,
    public_key: Vec<u8>,
}


#[wasm_bindgen]
pub fn encrypt_master_key(input: &str) -> EncryptedMasterKey {
    let salt = SaltString::generate(&mut OsRng);
    // Generate the data encryption key from input
    let encryption_key = get_key_encryption_key(input, salt.as_str());
    log(&bytes_to_hex(&encryption_key));

    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);
    log("Generated X25519 key pair");

    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = generate_nonce();

    log(&bytes_to_hex(&nonce));

    // Encrypt the private key
    let ciphertext = cipher
        .encrypt(&nonce, secret.to_bytes().as_ref())
        .expect("Failed to encrypt master key");
    
    EncryptedMasterKey {
        encrypted_private_key: ciphertext,
        public_key: public.to_bytes().to_vec(),
        nonce: nonce.to_vec(),
        salt: salt.as_str().to_string(),

    }
}

#[wasm_bindgen]
impl EncryptedMasterKey {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> {
        self.nonce.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key(&self) -> Vec<u8> {
        self.encrypted_private_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> {
        self.public_key.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn salt(&self) -> String {
        self.salt.clone()
    }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String {
        bytes_to_hex(&self.nonce)
    }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key_hex(&self) -> String {
        bytes_to_hex(&self.encrypted_private_key)
    }

    #[wasm_bindgen(getter)]
    pub fn public_key_hex(&self) -> String {
        bytes_to_hex(&self.public_key)
    }

}

// --- Recovery key support ---

#[wasm_bindgen]
pub struct EncryptedMasterKeyWithRecovery {
    // Password-encrypted fields (same as EncryptedMasterKey)
    nonce: Vec<u8>,
    salt: String,
    encrypted_private_key: Vec<u8>,
    public_key: Vec<u8>,
    // Recovery-encrypted fields
    recovery_key_hex: String,
    recovery_encrypted_private_key: Vec<u8>,
    recovery_salt: String,
    recovery_nonce: Vec<u8>,
}

/// Encrypts a master key using AES-256-GCM with both a password-derived KEK
/// and a randomly generated recovery key. The recovery key is returned once
/// and must be saved by the user offline.
#[wasm_bindgen]
pub fn encrypt_master_key_with_recovery(input: &str) -> EncryptedMasterKeyWithRecovery {
    log("Generating master key with recovery key...");

    let salt = SaltString::generate(&mut OsRng);
    let encryption_key = get_key_encryption_key(input, salt.as_str());

    // Generate X25519 key pair
    let secret = StaticSecret::random_from_rng(OsRng);
    let public = PublicKey::from(&secret);
    let private_key_bytes = secret.to_bytes();
    log("Generated X25519 key pair");

    // Encrypt private key with password-derived KEK
    let key = GenericArray::from_slice(&encryption_key);
    let cipher = Aes256Gcm::new(key);
    let nonce = generate_nonce();

    let ciphertext = cipher
        .encrypt(&nonce, private_key_bytes.as_ref())
        .expect("Failed to encrypt master key with password");

    // Generate a random 256-bit recovery key
    let recovery_secret = StaticSecret::random_from_rng(OsRng);
    let recovery_key_bytes = recovery_secret.to_bytes();
    let recovery_key_hex = bytes_to_hex(&recovery_key_bytes);
    log("Generated recovery key");

    // Encrypt private key with recovery-derived KEK
    let recovery_salt = SaltString::generate(&mut OsRng);
    let recovery_encryption_key = get_key_encryption_key(&recovery_key_hex, recovery_salt.as_str());
    let recovery_key_ga = GenericArray::from_slice(&recovery_encryption_key);
    let recovery_cipher = Aes256Gcm::new(recovery_key_ga);
    let recovery_nonce = generate_nonce();

    let recovery_ciphertext = recovery_cipher
        .encrypt(&recovery_nonce, private_key_bytes.as_ref())
        .expect("Failed to encrypt master key with recovery key");

    log("Master key with recovery key generated successfully");

    EncryptedMasterKeyWithRecovery {
        encrypted_private_key: ciphertext,
        public_key: public.to_bytes().to_vec(),
        nonce: nonce.to_vec(),
        salt: salt.as_str().to_string(),
        recovery_key_hex,
        recovery_encrypted_private_key: recovery_ciphertext,
        recovery_salt: recovery_salt.as_str().to_string(),
        recovery_nonce: recovery_nonce.to_vec(),
    }
}

#[wasm_bindgen]
impl EncryptedMasterKeyWithRecovery {
    #[wasm_bindgen(getter)]
    pub fn nonce(&self) -> Vec<u8> { self.nonce.clone() }

    #[wasm_bindgen(getter)]
    pub fn nonce_hex(&self) -> String { bytes_to_hex(&self.nonce) }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key(&self) -> Vec<u8> { self.encrypted_private_key.clone() }

    #[wasm_bindgen(getter)]
    pub fn encrypted_private_key_hex(&self) -> String { bytes_to_hex(&self.encrypted_private_key) }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> Vec<u8> { self.public_key.clone() }

    #[wasm_bindgen(getter)]
    pub fn public_key_hex(&self) -> String { bytes_to_hex(&self.public_key) }

    #[wasm_bindgen(getter)]
    pub fn salt(&self) -> String { self.salt.clone() }

    #[wasm_bindgen(getter)]
    pub fn recovery_key_hex(&self) -> String { self.recovery_key_hex.clone() }

    #[wasm_bindgen(getter)]
    pub fn recovery_encrypted_private_key_hex(&self) -> String {
        bytes_to_hex(&self.recovery_encrypted_private_key)
    }

    #[wasm_bindgen(getter)]
    pub fn recovery_salt(&self) -> String { self.recovery_salt.clone() }

    #[wasm_bindgen(getter)]
    pub fn recovery_nonce_hex(&self) -> String { bytes_to_hex(&self.recovery_nonce) }
}