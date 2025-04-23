// src/lib/crypto.ts
import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'myseelia-crypto-store';
const KEY_STORE_NAME = 'keys';
const ASYMMETRIC_KEY_NAME = 'user-asymmetric-keys'; // Store key pair under one name

// --- Database Setup ---

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(KEY_STORE_NAME)) {
          db.createObjectStore(KEY_STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
}

// --- Key Storage ---

export async function storeKeyPair(keyPair: CryptoKeyPair): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
  const store = tx.objectStore(KEY_STORE_NAME);
  // Store both keys together for simplicity
  await store.put({ publicKey: keyPair.publicKey, privateKey: keyPair.privateKey }, ASYMMETRIC_KEY_NAME);
  await tx.done;
  console.log('Key pair stored in IndexedDB');
}

export async function retrieveKeyPair(): Promise<CryptoKeyPair | null> {
  try {
    const db = await getDb();
    const storedKeys = await db.get(KEY_STORE_NAME, ASYMMETRIC_KEY_NAME);
    if (storedKeys && storedKeys.publicKey instanceof CryptoKey && storedKeys.privateKey instanceof CryptoKey) {
      console.log('Key pair retrieved from IndexedDB');
      return { publicKey: storedKeys.publicKey, privateKey: storedKeys.privateKey };
    }
    console.log('No key pair found in IndexedDB');
    return null;
  } catch (error) {
    console.error('Error retrieving key pair:', error);
    return null;
  }
}

export async function clearKeyPair(): Promise<void> {
  const db = await getDb();
  const tx = db.transaction(KEY_STORE_NAME, 'readwrite');
  await tx.objectStore(KEY_STORE_NAME).delete(ASYMMETRIC_KEY_NAME);
  await tx.done;
  console.log('Key pair cleared from IndexedDB');
}

// --- Asymmetric Key Generation (RSA-OAEP for encrypting symmetric keys) ---

export async function generateRSAKeyPair(): Promise<CryptoKeyPair> {
  console.log('Generating RSA-OAEP key pair...');
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048, // Standard length
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: 'SHA-256',
    },
    true, // Extractable
    ['encrypt', 'decrypt'] // Private key can decrypt, Public key can encrypt
  );
  console.log('RSA-OAEP key pair generated.');
  return keyPair;
}

// --- Symmetric Key Generation (AES-GCM for content encryption) ---

export async function generateAESKey(): Promise<CryptoKey> {
  console.log('Generating AES-GCM key...');
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: 256, // 256-bit key
    },
    true, // Extractable
    ['encrypt', 'decrypt']
  );
  console.log('AES-GCM key generated.');
  return key;
}

// --- Encryption/Decryption (Placeholders - Implementations needed) ---

// Encrypt data using AES-GCM
export async function encryptAES(data: Uint8Array, key: CryptoKey): Promise<{ ciphertext: ArrayBuffer, iv: Uint8Array }> {
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV recommended for AES-GCM
  console.log('Encrypting data with AES-GCM...');
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    data
  );
  console.log('Data encrypted.');
  return { ciphertext, iv };
}

// Decrypt data using AES-GCM
export async function decryptAES(ciphertext: ArrayBuffer, key: CryptoKey, iv: Uint8Array): Promise<Uint8Array> {
  console.log('Decrypting data with AES-GCM...');
  try {
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      ciphertext
    );
    console.log('Data decrypted.');
    return new Uint8Array(decryptedData);
  } catch (error) {
    console.error('AES decryption failed:', error);
    throw new Error('Decryption failed. Invalid key or ciphertext?');
  }
}

// Encrypt an AES key using RSA-OAEP public key
export async function encryptAESKeyWithRSA(aesKey: CryptoKey, rsaPublicKey: CryptoKey): Promise<ArrayBuffer> {
  console.log('Encrypting AES key with RSA public key...');
  // Export the AES key to raw format to encrypt it
  const aesKeyRaw = await crypto.subtle.exportKey('raw', aesKey);
  const encryptedKey = await crypto.subtle.encrypt(
    {
      name: 'RSA-OAEP',
    },
    // @ts-ignore - Suppress persistent type error for this line again
    rsaPublicKey,
    aesKeyRaw
  );
  console.log('AES key encrypted.');
  return encryptedKey;
}

// Decrypt an AES key using RSA-OAEP private key
export async function decryptAESKeyWithRSA(encryptedKey: ArrayBuffer, rsaPrivateKey: CryptoKey): Promise<CryptoKey> {
  console.log('Decrypting AES key with RSA private key...');
  try {
    const decryptedKeyRaw = await crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP',
      },
      rsaPrivateKey,
      encryptedKey
    );
    // Import the decrypted raw key back into a CryptoKey object
    const aesKey = await crypto.subtle.importKey(
      'raw',
      decryptedKeyRaw,
      { name: 'AES-GCM', length: 256 },
      true, // Extractable
      ['encrypt', 'decrypt']
    );
    console.log('AES key decrypted.');
    return aesKey;
  } catch (error) {
    console.error('RSA decryption of AES key failed:', error);
    throw new Error('Failed to decrypt symmetric key.');
  }
}

// Helper to export public key for storage/sharing (e.g., in user manifest)
export async function exportPublicKey(key: CryptoKey): Promise<JsonWebKey> {
    return crypto.subtle.exportKey('jwk', key);
}

// Helper to import public key (e.g., from user manifest)
export async function importPublicKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true, // Extractable must be true if the key was exportable
        ['encrypt'] // Public key is only used for encryption
    );
}

// Helper to export private key for syncing
export async function exportPrivateKey(key: CryptoKey): Promise<JsonWebKey> {
    return crypto.subtle.exportKey('jwk', key);
}

// Helper to import private key for syncing
export async function importPrivateKey(jwk: JsonWebKey): Promise<CryptoKey> {
    return crypto.subtle.importKey(
        'jwk',
        jwk,
        {
            name: 'RSA-OAEP',
            hash: 'SHA-256',
        },
        true, // Key must be extractable
        ['decrypt'] // Private key is used for decryption
    );
}
