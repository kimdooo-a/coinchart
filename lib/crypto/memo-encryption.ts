/**
 * Secure Memo Encryption Module
 * Uses Web Crypto API for client-side encryption
 * - PBKDF2 with 100,000 iterations for key derivation
 * - AES-256-GCM for authenticated encryption
 */

const PBKDF2_ITERATIONS = 100000;
const SALT_LENGTH = 16; // 128 bits
const IV_LENGTH = 12;   // 96 bits (recommended for GCM)
const KEY_LENGTH = 256; // AES-256

export interface EncryptedData {
    encryptedContent: string; // base64
    salt: string;             // base64
    iv: string;               // base64
}

export interface DecryptedData {
    content: string;
}

/**
 * Generate cryptographically secure random bytes
 */
function generateRandomBytes(length: number): Uint8Array {
    return crypto.getRandomValues(new Uint8Array(length));
}

/**
 * Convert ArrayBuffer to base64 string
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

/**
 * Convert base64 string to Uint8Array
 */
function base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

/**
 * Derive encryption key from password using PBKDF2
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        passwordBuffer,
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt.buffer as ArrayBuffer,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256'
        },
        keyMaterial,
        {
            name: 'AES-GCM',
            length: KEY_LENGTH
        },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * Encrypt content with user password
 */
export async function encryptMemo(content: string, password: string): Promise<EncryptedData> {
    const salt = generateRandomBytes(SALT_LENGTH);
    const iv = generateRandomBytes(IV_LENGTH);

    const key = await deriveKey(password, salt);

    const encoder = new TextEncoder();
    const contentBuffer = encoder.encode(content);

    const encryptedBuffer = await crypto.subtle.encrypt(
        {
            name: 'AES-GCM',
            iv: iv.buffer as ArrayBuffer
        },
        key,
        contentBuffer
    );

    return {
        encryptedContent: arrayBufferToBase64(encryptedBuffer),
        salt: arrayBufferToBase64(salt.buffer as ArrayBuffer),
        iv: arrayBufferToBase64(iv.buffer as ArrayBuffer)
    };
}

/**
 * Decrypt content with user password
 * Throws error if password is wrong (AES-GCM authentication fails)
 */
export async function decryptMemo(
    encryptedContent: string,
    salt: string,
    iv: string,
    password: string
): Promise<DecryptedData> {
    const encryptedBytes = base64ToUint8Array(encryptedContent);
    const saltBytes = base64ToUint8Array(salt);
    const ivBytes = base64ToUint8Array(iv);

    const key = await deriveKey(password, saltBytes);

    try {
        const decryptedBuffer = await crypto.subtle.decrypt(
            {
                name: 'AES-GCM',
                iv: ivBytes.buffer as ArrayBuffer
            },
            key,
            encryptedBytes.buffer as ArrayBuffer
        );

        const decoder = new TextDecoder();
        return {
            content: decoder.decode(decryptedBuffer)
        };
    } catch {
        throw new Error('DECRYPTION_FAILED');
    }
}
