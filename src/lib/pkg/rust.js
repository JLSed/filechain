/* @ts-self-types="./rust.d.ts" */

export class BlockSignatureResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(BlockSignatureResult.prototype);
        obj.__wbg_ptr = ptr;
        BlockSignatureResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        BlockSignatureResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_blocksignatureresult_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.blocksignatureresult_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get signature_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.blocksignatureresult_signature_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.blocksignatureresult_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) BlockSignatureResult.prototype[Symbol.dispose] = BlockSignatureResult.prototype.free;

/**
 * Result of file decryption operation
 */
export class DecryptedFileResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DecryptedFileResult.prototype);
        obj.__wbg_ptr = ptr;
        DecryptedFileResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DecryptedFileResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decryptedfileresult_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get decrypted_data() {
        const ret = wasm.decryptedfileresult_decrypted_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.decryptedfileresult_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get file_hash_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.decryptedfileresult_file_hash_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.decryptedfileresult_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) DecryptedFileResult.prototype[Symbol.dispose] = DecryptedFileResult.prototype.free;

export class DecryptedPrivateKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(DecryptedPrivateKey.prototype);
        obj.__wbg_ptr = ptr;
        DecryptedPrivateKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        DecryptedPrivateKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_decryptedprivatekey_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.decryptedprivatekey_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get private_key() {
        const ret = wasm.decryptedprivatekey_private_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.decryptedprivatekey_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.decryptedprivatekey_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) DecryptedPrivateKey.prototype[Symbol.dispose] = DecryptedPrivateKey.prototype.free;

export class EncryptedFileResult {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EncryptedFileResult.prototype);
        obj.__wbg_ptr = ptr;
        EncryptedFileResultFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptedFileResultFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptedfileresult_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get dek_nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_dek_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get encrypted_data() {
        const ret = wasm.encryptedfileresult_encrypted_data(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {Uint8Array}
     */
    get encrypted_dek() {
        const ret = wasm.encryptedfileresult_encrypted_dek(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get encrypted_dek_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_encrypted_dek_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get ephemeral_public_key() {
        const ret = wasm.encryptedfileresult_ephemeral_public_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get ephemeral_public_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_ephemeral_public_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get file_nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_file_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get original_hash_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedfileresult_original_hash_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.encryptedfileresult_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) EncryptedFileResult.prototype[Symbol.dispose] = EncryptedFileResult.prototype.free;

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
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EncryptedMasterKey.prototype);
        obj.__wbg_ptr = ptr;
        EncryptedMasterKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptedMasterKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptedmasterkey_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get encrypted_private_key() {
        const ret = wasm.encryptedmasterkey_encrypted_private_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkey_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get nonce() {
        const ret = wasm.encryptedmasterkey_nonce(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkey_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get public_key() {
        const ret = wasm.encryptedmasterkey_public_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get public_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkey_public_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkey_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) EncryptedMasterKey.prototype[Symbol.dispose] = EncryptedMasterKey.prototype.free;

export class EncryptedMasterKeyWithRecovery {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(EncryptedMasterKeyWithRecovery.prototype);
        obj.__wbg_ptr = ptr;
        EncryptedMasterKeyWithRecoveryFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        EncryptedMasterKeyWithRecoveryFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_encryptedmasterkeywithrecovery_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get encrypted_private_key() {
        const ret = wasm.encryptedmasterkeywithrecovery_encrypted_private_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get nonce() {
        const ret = wasm.encryptedmasterkeywithrecovery_nonce(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get public_key() {
        const ret = wasm.encryptedmasterkeywithrecovery_public_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get public_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_public_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_recovery_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_recovery_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_recovery_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_recovery_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.encryptedmasterkeywithrecovery_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
}
if (Symbol.dispose) EncryptedMasterKeyWithRecovery.prototype[Symbol.dispose] = EncryptedMasterKeyWithRecovery.prototype.free;

export class GeneratedRecoveryKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(GeneratedRecoveryKey.prototype);
        obj.__wbg_ptr = ptr;
        GeneratedRecoveryKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        GeneratedRecoveryKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_generatedrecoverykey_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.generatedrecoverykey_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.generatedrecoverykey_recovery_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.generatedrecoverykey_recovery_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.generatedrecoverykey_recovery_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.generatedrecoverykey_recovery_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.generatedrecoverykey_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) GeneratedRecoveryKey.prototype[Symbol.dispose] = GeneratedRecoveryKey.prototype.free;

export class ReEncryptedPrivateKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(ReEncryptedPrivateKey.prototype);
        obj.__wbg_ptr = ptr;
        ReEncryptedPrivateKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        ReEncryptedPrivateKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_reencryptedprivatekey_free(ptr, 0);
    }
    /**
     * @returns {Uint8Array}
     */
    get encrypted_private_key() {
        const ret = wasm.reencryptedprivatekey_encrypted_private_key(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.reencryptedprivatekey_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.reencryptedprivatekey_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {Uint8Array}
     */
    get nonce() {
        const ret = wasm.reencryptedprivatekey_nonce(this.__wbg_ptr);
        var v1 = getArrayU8FromWasm0(ret[0], ret[1]).slice();
        wasm.__wbindgen_free(ret[0], ret[1] * 1, 1);
        return v1;
    }
    /**
     * @returns {string}
     */
    get nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.reencryptedprivatekey_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.reencryptedprivatekey_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.reencryptedprivatekey_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) ReEncryptedPrivateKey.prototype[Symbol.dispose] = ReEncryptedPrivateKey.prototype.free;

export class RecoveredPrivateKey {
    static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(RecoveredPrivateKey.prototype);
        obj.__wbg_ptr = ptr;
        RecoveredPrivateKeyFinalization.register(obj, obj.__wbg_ptr, obj);
        return obj;
    }
    __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        RecoveredPrivateKeyFinalization.unregister(this);
        return ptr;
    }
    free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recoveredprivatekey_free(ptr, 0);
    }
    /**
     * @returns {string}
     */
    get encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get error_message() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_error_message(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get new_recovery_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_new_recovery_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_encrypted_private_key_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_recovery_encrypted_private_key_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_nonce_hex() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_recovery_nonce_hex(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get recovery_salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_recovery_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {string}
     */
    get salt() {
        let deferred1_0;
        let deferred1_1;
        try {
            const ret = wasm.recoveredprivatekey_salt(this.__wbg_ptr);
            deferred1_0 = ret[0];
            deferred1_1 = ret[1];
            return getStringFromWasm0(ret[0], ret[1]);
        } finally {
            wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
    }
    /**
     * @returns {boolean}
     */
    get success() {
        const ret = wasm.recoveredprivatekey_success(this.__wbg_ptr);
        return ret !== 0;
    }
}
if (Symbol.dispose) RecoveredPrivateKey.prototype[Symbol.dispose] = RecoveredPrivateKey.prototype.free;

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
 * @param {any} val
 * @returns {DecryptedFileResult}
 */
export function decrypt_file(val) {
    const ret = wasm.decrypt_file(val);
    return DecryptedFileResult.__wrap(ret);
}

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
 * @param {string} password
 * @param {string} salt
 * @param {Uint8Array} encrypted_key
 * @param {Uint8Array} nonce
 * @returns {DecryptedPrivateKey}
 */
export function decrypt_private_key(password, salt, encrypted_key, nonce) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(encrypted_key, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(nonce, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.decrypt_private_key(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return DecryptedPrivateKey.__wrap(ret);
}

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
 * @param {Uint8Array} file_data
 * @param {Uint8Array} recipient_public_key
 * @returns {EncryptedFileResult}
 */
export function encrypt_file(file_data, recipient_public_key) {
    const ptr0 = passArray8ToWasm0(file_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passArray8ToWasm0(recipient_public_key, wasm.__wbindgen_malloc);
    const len1 = WASM_VECTOR_LEN;
    const ret = wasm.encrypt_file(ptr0, len0, ptr1, len1);
    return EncryptedFileResult.__wrap(ret);
}

/**
 * Encrypts file data using hybrid encryption for multiple recipients.
 *
 * # Arguments
 * * `file_data` - The raw file bytes to encrypt
 * * `recipients_js` - A JsValue representing an array of { user_id: string, public_key: number[] }
 *
 * # Returns
 * A JsValue containing MultiKeyEncryptResultData with encrypted file and per-recipient DEK entries.
 * @param {Uint8Array} file_data
 * @param {any} recipients_js
 * @returns {any}
 */
export function encrypt_file_multi(file_data, recipients_js) {
    const ptr0 = passArray8ToWasm0(file_data, wasm.__wbindgen_malloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.encrypt_file_multi(ptr0, len0, recipients_js);
    return ret;
}

/**
 * @param {string} input
 * @returns {EncryptedMasterKey}
 */
export function encrypt_master_key(input) {
    const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.encrypt_master_key(ptr0, len0);
    return EncryptedMasterKey.__wrap(ret);
}

/**
 * Encrypts a master key using AES-256-GCM with both a password-derived KEK
 * and a randomly generated recovery key. The recovery key is returned once
 * and must be saved by the user offline.
 * @param {string} input
 * @returns {EncryptedMasterKeyWithRecovery}
 */
export function encrypt_master_key_with_recovery(input) {
    const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ret = wasm.encrypt_master_key_with_recovery(ptr0, len0);
    return EncryptedMasterKeyWithRecovery.__wrap(ret);
}

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
 * @param {string} uploader_id
 * @param {number} timestamp_ms
 * @param {string} file_hash
 * @param {string} previous_block_hash
 * @returns {BlockSignatureResult}
 */
export function generate_block_signature(uploader_id, timestamp_ms, file_hash, previous_block_hash) {
    const ptr0 = passStringToWasm0(uploader_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(file_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passStringToWasm0(previous_block_hash, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len2 = WASM_VECTOR_LEN;
    const ret = wasm.generate_block_signature(ptr0, len0, timestamp_ms, ptr1, len1, ptr2, len2);
    return BlockSignatureResult.__wrap(ret);
}

/**
 * @returns {string}
 */
export function generate_nonce_hex() {
    let deferred1_0;
    let deferred1_1;
    try {
        const ret = wasm.generate_nonce_hex();
        deferred1_0 = ret[0];
        deferred1_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
    }
}

/**
 * Generates a recovery key for an existing user who already has a password-encrypted private key.
 * Requires the current password to decrypt the private key first.
 * @param {string} password
 * @param {string} salt
 * @param {Uint8Array} encrypted_key
 * @param {Uint8Array} nonce_bytes
 * @returns {GeneratedRecoveryKey}
 */
export function generate_recovery_key_for_existing(password, salt, encrypted_key, nonce_bytes) {
    const ptr0 = passStringToWasm0(password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(encrypted_key, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(nonce_bytes, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ret = wasm.generate_recovery_key_for_existing(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3);
    return GeneratedRecoveryKey.__wrap(ret);
}

export function greet() {
    wasm.greet();
}

/**
 * @param {string} input
 * @param {string} salt
 * @returns {string}
 */
export function master_key_bytes_to_hex(input, salt) {
    let deferred3_0;
    let deferred3_1;
    try {
        const ptr0 = passStringToWasm0(input, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passStringToWasm0(salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.master_key_bytes_to_hex(ptr0, len0, ptr1, len1);
        deferred3_0 = ret[0];
        deferred3_1 = ret[1];
        return getStringFromWasm0(ret[0], ret[1]);
    } finally {
        wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
    }
}

/**
 * Re-encrypts a file's DEK for a new recipient.
 *
 * Flow:
 * 1. Decrypt the sharer's private key using their password
 * 2. ECDH(sharer_private_key, file_ephemeral_public_key) → shared secret
 * 3. Decrypt the DEK using the shared secret
 * 4. Generate a new ephemeral key pair
 * 5. ECDH(new_ephemeral_private, target_public_key) → new shared secret
 * 6. Encrypt the DEK with the new shared secret
 * @param {any} input_js
 * @returns {any}
 */
export function re_encrypt_dek_for_recipient(input_js) {
    const ret = wasm.re_encrypt_dek_for_recipient(input_js);
    return ret;
}

/**
 * @param {string} old_password
 * @param {string} old_salt
 * @param {Uint8Array} encrypted_key
 * @param {Uint8Array} old_nonce
 * @param {string} new_password
 * @returns {ReEncryptedPrivateKey}
 */
export function re_encrypt_private_key(old_password, old_salt, encrypted_key, old_nonce, new_password) {
    const ptr0 = passStringToWasm0(old_password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(old_salt, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(encrypted_key, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(old_nonce, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(new_password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.re_encrypt_private_key(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
    return ReEncryptedPrivateKey.__wrap(ret);
}

/**
 * Recovers a private key using a recovery key, then re-encrypts it with a new password.
 * Also generates a fresh recovery key and re-encrypts the private key with it.
 * This is the core function for the "forgot password with recovery key" flow.
 * @param {string} recovery_key
 * @param {string} recovery_salt_str
 * @param {Uint8Array} recovery_encrypted_key
 * @param {Uint8Array} recovery_nonce_bytes
 * @param {string} new_password
 * @returns {RecoveredPrivateKey}
 */
export function recover_and_reencrypt_private_key(recovery_key, recovery_salt_str, recovery_encrypted_key, recovery_nonce_bytes, new_password) {
    const ptr0 = passStringToWasm0(recovery_key, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len0 = WASM_VECTOR_LEN;
    const ptr1 = passStringToWasm0(recovery_salt_str, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len1 = WASM_VECTOR_LEN;
    const ptr2 = passArray8ToWasm0(recovery_encrypted_key, wasm.__wbindgen_malloc);
    const len2 = WASM_VECTOR_LEN;
    const ptr3 = passArray8ToWasm0(recovery_nonce_bytes, wasm.__wbindgen_malloc);
    const len3 = WASM_VECTOR_LEN;
    const ptr4 = passStringToWasm0(new_password, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
    const len4 = WASM_VECTOR_LEN;
    const ret = wasm.recover_and_reencrypt_private_key(ptr0, len0, ptr1, len1, ptr2, len2, ptr3, len3, ptr4, len4);
    return RecoveredPrivateKey.__wrap(ret);
}

function __wbg_get_imports() {
    const import0 = {
        __proto__: null,
        __wbg_Error_8c4e43fe74559d73: function(arg0, arg1) {
            const ret = Error(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_Number_04624de7d0e8332d: function(arg0) {
            const ret = Number(arg0);
            return ret;
        },
        __wbg_String_8f0eb39a4a4c2f66: function(arg0, arg1) {
            const ret = String(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_boolean_get_bbbb1c18aa2f5e25: function(arg0) {
            const v = arg0;
            const ret = typeof(v) === 'boolean' ? v : undefined;
            return isLikeNone(ret) ? 0xFFFFFF : ret ? 1 : 0;
        },
        __wbg___wbindgen_debug_string_0bc8482c6e3508ae: function(arg0, arg1) {
            const ret = debugString(arg1);
            const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            const len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_in_47fa6863be6f2f25: function(arg0, arg1) {
            const ret = arg0 in arg1;
            return ret;
        },
        __wbg___wbindgen_is_function_0095a73b8b156f76: function(arg0) {
            const ret = typeof(arg0) === 'function';
            return ret;
        },
        __wbg___wbindgen_is_object_5ae8e5880f2c1fbd: function(arg0) {
            const val = arg0;
            const ret = typeof(val) === 'object' && val !== null;
            return ret;
        },
        __wbg___wbindgen_is_string_cd444516edc5b180: function(arg0) {
            const ret = typeof(arg0) === 'string';
            return ret;
        },
        __wbg___wbindgen_is_undefined_9e4d92534c42d778: function(arg0) {
            const ret = arg0 === undefined;
            return ret;
        },
        __wbg___wbindgen_jsval_loose_eq_9dd77d8cd6671811: function(arg0, arg1) {
            const ret = arg0 == arg1;
            return ret;
        },
        __wbg___wbindgen_number_get_8ff4255516ccad3e: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'number' ? obj : undefined;
            getDataViewMemory0().setFloat64(arg0 + 8 * 1, isLikeNone(ret) ? 0 : ret, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, !isLikeNone(ret), true);
        },
        __wbg___wbindgen_string_get_72fb696202c56729: function(arg0, arg1) {
            const obj = arg1;
            const ret = typeof(obj) === 'string' ? obj : undefined;
            var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
            var len1 = WASM_VECTOR_LEN;
            getDataViewMemory0().setInt32(arg0 + 4 * 1, len1, true);
            getDataViewMemory0().setInt32(arg0 + 4 * 0, ptr1, true);
        },
        __wbg___wbindgen_throw_be289d5034ed271b: function(arg0, arg1) {
            throw new Error(getStringFromWasm0(arg0, arg1));
        },
        __wbg_alert_836f9205077e0bb0: function(arg0, arg1) {
            alert(getStringFromWasm0(arg0, arg1));
        },
        __wbg_call_389efe28435a9388: function() { return handleError(function (arg0, arg1) {
            const ret = arg0.call(arg1);
            return ret;
        }, arguments); },
        __wbg_call_4708e0c13bdc8e95: function() { return handleError(function (arg0, arg1, arg2) {
            const ret = arg0.call(arg1, arg2);
            return ret;
        }, arguments); },
        __wbg_crypto_86f2631e91b51511: function(arg0) {
            const ret = arg0.crypto;
            return ret;
        },
        __wbg_done_57b39ecd9addfe81: function(arg0) {
            const ret = arg0.done;
            return ret;
        },
        __wbg_getRandomValues_b3f15fcbfabb0f8b: function() { return handleError(function (arg0, arg1) {
            arg0.getRandomValues(arg1);
        }, arguments); },
        __wbg_get_9b94d73e6221f75c: function(arg0, arg1) {
            const ret = arg0[arg1 >>> 0];
            return ret;
        },
        __wbg_get_b3ed3ad4be2bc8ac: function() { return handleError(function (arg0, arg1) {
            const ret = Reflect.get(arg0, arg1);
            return ret;
        }, arguments); },
        __wbg_get_with_ref_key_1dc361bd10053bfe: function(arg0, arg1) {
            const ret = arg0[arg1];
            return ret;
        },
        __wbg_instanceof_ArrayBuffer_c367199e2fa2aa04: function(arg0) {
            let result;
            try {
                result = arg0 instanceof ArrayBuffer;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_instanceof_Uint8Array_9b9075935c74707c: function(arg0) {
            let result;
            try {
                result = arg0 instanceof Uint8Array;
            } catch (_) {
                result = false;
            }
            const ret = result;
            return ret;
        },
        __wbg_isArray_d314bb98fcf08331: function(arg0) {
            const ret = Array.isArray(arg0);
            return ret;
        },
        __wbg_isSafeInteger_bfbc7332a9768d2a: function(arg0) {
            const ret = Number.isSafeInteger(arg0);
            return ret;
        },
        __wbg_iterator_6ff6560ca1568e55: function() {
            const ret = Symbol.iterator;
            return ret;
        },
        __wbg_length_32ed9a279acd054c: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_length_35a7bace40f36eac: function(arg0) {
            const ret = arg0.length;
            return ret;
        },
        __wbg_log_d7be6feae117d748: function(arg0, arg1) {
            console.log(getStringFromWasm0(arg0, arg1));
        },
        __wbg_msCrypto_d562bbe83e0d4b91: function(arg0) {
            const ret = arg0.msCrypto;
            return ret;
        },
        __wbg_new_361308b2356cecd0: function() {
            const ret = new Object();
            return ret;
        },
        __wbg_new_3eb36ae241fe6f44: function() {
            const ret = new Array();
            return ret;
        },
        __wbg_new_dd2b680c8bf6ae29: function(arg0) {
            const ret = new Uint8Array(arg0);
            return ret;
        },
        __wbg_new_no_args_1c7c842f08d00ebb: function(arg0, arg1) {
            const ret = new Function(getStringFromWasm0(arg0, arg1));
            return ret;
        },
        __wbg_new_with_length_a2c39cbe88fd8ff1: function(arg0) {
            const ret = new Uint8Array(arg0 >>> 0);
            return ret;
        },
        __wbg_next_3482f54c49e8af19: function() { return handleError(function (arg0) {
            const ret = arg0.next();
            return ret;
        }, arguments); },
        __wbg_next_418f80d8f5303233: function(arg0) {
            const ret = arg0.next;
            return ret;
        },
        __wbg_node_e1f24f89a7336c2e: function(arg0) {
            const ret = arg0.node;
            return ret;
        },
        __wbg_process_3975fd6c72f520aa: function(arg0) {
            const ret = arg0.process;
            return ret;
        },
        __wbg_prototypesetcall_bdcdcc5842e4d77d: function(arg0, arg1, arg2) {
            Uint8Array.prototype.set.call(getArrayU8FromWasm0(arg0, arg1), arg2);
        },
        __wbg_randomFillSync_f8c153b79f285817: function() { return handleError(function (arg0, arg1) {
            arg0.randomFillSync(arg1);
        }, arguments); },
        __wbg_require_b74f47fc2d022fd6: function() { return handleError(function () {
            const ret = module.require;
            return ret;
        }, arguments); },
        __wbg_set_3f1d0b984ed272ed: function(arg0, arg1, arg2) {
            arg0[arg1] = arg2;
        },
        __wbg_set_f43e577aea94465b: function(arg0, arg1, arg2) {
            arg0[arg1 >>> 0] = arg2;
        },
        __wbg_static_accessor_GLOBAL_12837167ad935116: function() {
            const ret = typeof global === 'undefined' ? null : global;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_GLOBAL_THIS_e628e89ab3b1c95f: function() {
            const ret = typeof globalThis === 'undefined' ? null : globalThis;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_SELF_a621d3dfbb60d0ce: function() {
            const ret = typeof self === 'undefined' ? null : self;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_static_accessor_WINDOW_f8727f0cf888e0bd: function() {
            const ret = typeof window === 'undefined' ? null : window;
            return isLikeNone(ret) ? 0 : addToExternrefTable0(ret);
        },
        __wbg_subarray_a96e1fef17ed23cb: function(arg0, arg1, arg2) {
            const ret = arg0.subarray(arg1 >>> 0, arg2 >>> 0);
            return ret;
        },
        __wbg_value_0546255b415e96c1: function(arg0) {
            const ret = arg0.value;
            return ret;
        },
        __wbg_versions_4e31226f5e8dc909: function(arg0) {
            const ret = arg0.versions;
            return ret;
        },
        __wbindgen_cast_0000000000000001: function(arg0) {
            // Cast intrinsic for `F64 -> Externref`.
            const ret = arg0;
            return ret;
        },
        __wbindgen_cast_0000000000000002: function(arg0, arg1) {
            // Cast intrinsic for `Ref(Slice(U8)) -> NamedExternref("Uint8Array")`.
            const ret = getArrayU8FromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_cast_0000000000000003: function(arg0, arg1) {
            // Cast intrinsic for `Ref(String) -> Externref`.
            const ret = getStringFromWasm0(arg0, arg1);
            return ret;
        },
        __wbindgen_init_externref_table: function() {
            const table = wasm.__wbindgen_externrefs;
            const offset = table.grow(4);
            table.set(0, undefined);
            table.set(offset + 0, undefined);
            table.set(offset + 1, null);
            table.set(offset + 2, true);
            table.set(offset + 3, false);
        },
    };
    return {
        __proto__: null,
        "./rust_bg.js": import0,
    };
}

const BlockSignatureResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_blocksignatureresult_free(ptr >>> 0, 1));
const DecryptedFileResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_decryptedfileresult_free(ptr >>> 0, 1));
const DecryptedPrivateKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_decryptedprivatekey_free(ptr >>> 0, 1));
const EncryptedFileResultFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptedfileresult_free(ptr >>> 0, 1));
const EncryptedMasterKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptedmasterkey_free(ptr >>> 0, 1));
const EncryptedMasterKeyWithRecoveryFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_encryptedmasterkeywithrecovery_free(ptr >>> 0, 1));
const GeneratedRecoveryKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_generatedrecoverykey_free(ptr >>> 0, 1));
const ReEncryptedPrivateKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_reencryptedprivatekey_free(ptr >>> 0, 1));
const RecoveredPrivateKeyFinalization = (typeof FinalizationRegistry === 'undefined')
    ? { register: () => {}, unregister: () => {} }
    : new FinalizationRegistry(ptr => wasm.__wbg_recoveredprivatekey_free(ptr >>> 0, 1));

function addToExternrefTable0(obj) {
    const idx = wasm.__externref_table_alloc();
    wasm.__wbindgen_externrefs.set(idx, obj);
    return idx;
}

function debugString(val) {
    // primitive types
    const type = typeof val;
    if (type == 'number' || type == 'boolean' || val == null) {
        return  `${val}`;
    }
    if (type == 'string') {
        return `"${val}"`;
    }
    if (type == 'symbol') {
        const description = val.description;
        if (description == null) {
            return 'Symbol';
        } else {
            return `Symbol(${description})`;
        }
    }
    if (type == 'function') {
        const name = val.name;
        if (typeof name == 'string' && name.length > 0) {
            return `Function(${name})`;
        } else {
            return 'Function';
        }
    }
    // objects
    if (Array.isArray(val)) {
        const length = val.length;
        let debug = '[';
        if (length > 0) {
            debug += debugString(val[0]);
        }
        for(let i = 1; i < length; i++) {
            debug += ', ' + debugString(val[i]);
        }
        debug += ']';
        return debug;
    }
    // Test for built-in
    const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
    let className;
    if (builtInMatches && builtInMatches.length > 1) {
        className = builtInMatches[1];
    } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val);
    }
    if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
            return 'Object(' + JSON.stringify(val) + ')';
        } catch (_) {
            return 'Object';
        }
    }
    // errors
    if (val instanceof Error) {
        return `${val.name}: ${val.message}\n${val.stack}`;
    }
    // TODO we could test for more things here, like `Set`s and `Map`s.
    return className;
}

function getArrayU8FromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return getUint8ArrayMemory0().subarray(ptr / 1, ptr / 1 + len);
}

let cachedDataViewMemory0 = null;
function getDataViewMemory0() {
    if (cachedDataViewMemory0 === null || cachedDataViewMemory0.buffer.detached === true || (cachedDataViewMemory0.buffer.detached === undefined && cachedDataViewMemory0.buffer !== wasm.memory.buffer)) {
        cachedDataViewMemory0 = new DataView(wasm.memory.buffer);
    }
    return cachedDataViewMemory0;
}

function getStringFromWasm0(ptr, len) {
    ptr = ptr >>> 0;
    return decodeText(ptr, len);
}

let cachedUint8ArrayMemory0 = null;
function getUint8ArrayMemory0() {
    if (cachedUint8ArrayMemory0 === null || cachedUint8ArrayMemory0.byteLength === 0) {
        cachedUint8ArrayMemory0 = new Uint8Array(wasm.memory.buffer);
    }
    return cachedUint8ArrayMemory0;
}

function handleError(f, args) {
    try {
        return f.apply(this, args);
    } catch (e) {
        const idx = addToExternrefTable0(e);
        wasm.__wbindgen_exn_store(idx);
    }
}

function isLikeNone(x) {
    return x === undefined || x === null;
}

function passArray8ToWasm0(arg, malloc) {
    const ptr = malloc(arg.length * 1, 1) >>> 0;
    getUint8ArrayMemory0().set(arg, ptr / 1);
    WASM_VECTOR_LEN = arg.length;
    return ptr;
}

function passStringToWasm0(arg, malloc, realloc) {
    if (realloc === undefined) {
        const buf = cachedTextEncoder.encode(arg);
        const ptr = malloc(buf.length, 1) >>> 0;
        getUint8ArrayMemory0().subarray(ptr, ptr + buf.length).set(buf);
        WASM_VECTOR_LEN = buf.length;
        return ptr;
    }

    let len = arg.length;
    let ptr = malloc(len, 1) >>> 0;

    const mem = getUint8ArrayMemory0();

    let offset = 0;

    for (; offset < len; offset++) {
        const code = arg.charCodeAt(offset);
        if (code > 0x7F) break;
        mem[ptr + offset] = code;
    }
    if (offset !== len) {
        if (offset !== 0) {
            arg = arg.slice(offset);
        }
        ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
        const view = getUint8ArrayMemory0().subarray(ptr + offset, ptr + len);
        const ret = cachedTextEncoder.encodeInto(arg, view);

        offset += ret.written;
        ptr = realloc(ptr, len, offset, 1) >>> 0;
    }

    WASM_VECTOR_LEN = offset;
    return ptr;
}

let cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
cachedTextDecoder.decode();
const MAX_SAFARI_DECODE_BYTES = 2146435072;
let numBytesDecoded = 0;
function decodeText(ptr, len) {
    numBytesDecoded += len;
    if (numBytesDecoded >= MAX_SAFARI_DECODE_BYTES) {
        cachedTextDecoder = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true });
        cachedTextDecoder.decode();
        numBytesDecoded = len;
    }
    return cachedTextDecoder.decode(getUint8ArrayMemory0().subarray(ptr, ptr + len));
}

const cachedTextEncoder = new TextEncoder();

if (!('encodeInto' in cachedTextEncoder)) {
    cachedTextEncoder.encodeInto = function (arg, view) {
        const buf = cachedTextEncoder.encode(arg);
        view.set(buf);
        return {
            read: arg.length,
            written: buf.length
        };
    };
}

let WASM_VECTOR_LEN = 0;

let wasmModule, wasm;
function __wbg_finalize_init(instance, module) {
    wasm = instance.exports;
    wasmModule = module;
    cachedDataViewMemory0 = null;
    cachedUint8ArrayMemory0 = null;
    wasm.__wbindgen_start();
    return wasm;
}

async function __wbg_load(module, imports) {
    if (typeof Response === 'function' && module instanceof Response) {
        if (typeof WebAssembly.instantiateStreaming === 'function') {
            try {
                return await WebAssembly.instantiateStreaming(module, imports);
            } catch (e) {
                const validResponse = module.ok && expectedResponseType(module.type);

                if (validResponse && module.headers.get('Content-Type') !== 'application/wasm') {
                    console.warn("`WebAssembly.instantiateStreaming` failed because your server does not serve Wasm with `application/wasm` MIME type. Falling back to `WebAssembly.instantiate` which is slower. Original error:\n", e);

                } else { throw e; }
            }
        }

        const bytes = await module.arrayBuffer();
        return await WebAssembly.instantiate(bytes, imports);
    } else {
        const instance = await WebAssembly.instantiate(module, imports);

        if (instance instanceof WebAssembly.Instance) {
            return { instance, module };
        } else {
            return instance;
        }
    }

    function expectedResponseType(type) {
        switch (type) {
            case 'basic': case 'cors': case 'default': return true;
        }
        return false;
    }
}

function initSync(module) {
    if (wasm !== undefined) return wasm;


    if (module !== undefined) {
        if (Object.getPrototypeOf(module) === Object.prototype) {
            ({module} = module)
        } else {
            console.warn('using deprecated parameters for `initSync()`; pass a single object instead')
        }
    }

    const imports = __wbg_get_imports();
    if (!(module instanceof WebAssembly.Module)) {
        module = new WebAssembly.Module(module);
    }
    const instance = new WebAssembly.Instance(module, imports);
    return __wbg_finalize_init(instance, module);
}

async function __wbg_init(module_or_path) {
    if (wasm !== undefined) return wasm;


    if (module_or_path !== undefined) {
        if (Object.getPrototypeOf(module_or_path) === Object.prototype) {
            ({module_or_path} = module_or_path)
        } else {
            console.warn('using deprecated parameters for the initialization function; pass a single object instead')
        }
    }

    if (module_or_path === undefined) {
        module_or_path = new URL('rust_bg.wasm', import.meta.url);
    }
    const imports = __wbg_get_imports();

    if (typeof module_or_path === 'string' || (typeof Request === 'function' && module_or_path instanceof Request) || (typeof URL === 'function' && module_or_path instanceof URL)) {
        module_or_path = fetch(module_or_path);
    }

    const { instance, module } = await __wbg_load(await module_or_path, imports);

    return __wbg_finalize_init(instance, module);
}

export { initSync, __wbg_init as default };
