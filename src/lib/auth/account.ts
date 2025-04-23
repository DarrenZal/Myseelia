// src/lib/auth/account.ts
import { get } from 'svelte/store'; // Import the 'get' function
import * as cryptoUtils from '$lib/crypto'; // Use $lib alias and rename to avoid conflict
import * as ipfs from '$lib/ipfs';   // Use $lib alias
import { sessionStore } from '../../stores'; // Keep sessionStore
import * as browser from '$lib/browser'; // Keep browser utils for localStorage
import { addNotification } from '$lib/notifications'; // Import addNotification

// --- Constants ---
const MANIFEST_CID_STORAGE_KEY = 'myseelia-manifest-cid';

// --- Types ---
// Define structure for file metadata within the manifest
export interface ManifestFileEntry { // Added export
    cid: string;        // CID of encrypted file content
    iv: string;         // Base64 encoded IV for AES-GCM
    key: string;        // Base64 encoded AES key encrypted with RSA public key
    // Add other metadata like original filename, type, size if needed
    name: string;
    type: string;
    size: number;
    ctime: number;
    mtime: number;
}

// Define the structure of the user manifest stored on IPFS
export interface UserManifest { // Added export
    publicKey: JsonWebKey; // User's public RSA key (JWK format)
    files: {
        // Paths are keys, e.g., "gallery/public/image.jpg"
        [filePath: string]: ManifestFileEntry;
    };
}

// --- Registration ---

/**
 * Generates keys, creates an initial manifest, pins it to IPFS,
 * stores keys locally, and updates the session state.
 * The 'usernameInput' is currently ignored as identity is based on the generated key.
 */
export async function register(usernameInput?: string): Promise<boolean> {
    console.log('[Register] Function called.'); // Log entry

    try {
        console.log('[Register] Entering try block.');
        // 1. Check if keys already exist
        console.log('[Register] Checking for existing keys...');
        let keyPair = await cryptoUtils.retrieveKeyPair(); // Use renamed import
        if (keyPair) {
            console.warn('[Register] Keys already exist. Attempting login...');
            await loadAccount();
            const session = get(sessionStore);
            console.log('[Register] Login attempt finished. isAuthenticated:', session.isAuthenticated);
            return session.isAuthenticated;
        }
        console.log('[Register] No existing keys found.');

        // 2. Generate new RSA key pair
        console.log('[Register] Generating RSA key pair...');
        keyPair = await cryptoUtils.generateRSAKeyPair(); // Use renamed import
        console.log('[Register] RSA key pair generated.');

        // 3. Store key pair locally (IndexedDB)
        console.log('[Register] Storing key pair...');
        await cryptoUtils.storeKeyPair(keyPair); // Use renamed import
        console.log('[Register] Key pair stored.');

        // 4. Export public key
        console.log('[Register] Exporting public key...');
        const publicKeyJwk = await cryptoUtils.exportPublicKey(keyPair.publicKey); // Use renamed import
        console.log('[Register] Public key exported.');

        // 5. Create initial empty user manifest
        console.log('[Register] Creating initial manifest...');
        const initialManifest: UserManifest = {
            publicKey: publicKeyJwk,
            files: {},
        };
        console.log('[Register] Initial manifest created.');

        // 6. Pin the initial manifest to IPFS
        console.log('[Register] Pinning initial manifest to IPFS...');
        const manifestCid = await ipfs.pinJsonToIpfs(initialManifest, { name: 'myseelia-user-manifest-initial' });
        console.log('[Register] Pinning attempt finished. CID result:', manifestCid); // Log result immediately
        if (!manifestCid) {
            console.error('[Register] Failed to pin initial manifest to IPFS.');
            await cryptoUtils.clearKeyPair(); // Use renamed import
            return false;
        }
        console.log('[Register] Initial manifest pinned successfully. CID:', manifestCid);

        // 7. Store manifest CID locally (localStorage)
        console.log('[Register] Storing manifest CID locally...');
        if (browser.isBrowser()) {
            localStorage.setItem(MANIFEST_CID_STORAGE_KEY, manifestCid);
            console.log('[Register] Manifest CID stored.');
        } else {
            console.warn('[Register] Cannot store manifest CID outside browser environment.');
        }

        // 8. Update session store
        console.log('[Register] Updating session store...');
        sessionStore.set({
            username: publicKeyJwk.n,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            backupCreated: null, // Backup status needs separate implementation
        });
        console.log('Registration successful, session updated.');

        // Note: Filesystem initialization (creating dirs) is now handled implicitly
        // by adding entries to the manifest's 'files' object.

        return true;

    } catch (error) {
        console.error('Error during registration:', error);
        // Ensure partial state is cleaned up
        await cryptoUtils.clearKeyPair(); // Use renamed import
        if (browser.isBrowser()) {
            localStorage.removeItem(MANIFEST_CID_STORAGE_KEY);
        }
        sessionStore.set({
            username: null, isAuthenticated: false, isLoading: false, error: 'Registration failed.', backupCreated: null
        });
        return false;
    }
}

// --- Account Loading ---

/**
 * Loads account by retrieving local keys and fetching the manifest from IPFS.
 */
export async function loadAccount(): Promise<void> {
    console.log('Attempting to load account (Web Crypto)...');

    try {
        // 1. Retrieve key pair from IndexedDB
        const keyPair = await cryptoUtils.retrieveKeyPair(); // Use renamed import

        if (!keyPair) {
            console.log('No local key pair found. User is not logged in.');
            sessionStore.set({
                username: null, isAuthenticated: false, isLoading: false, error: null, backupCreated: null
            });
            // Ensure manifest CID is also cleared if keys are missing
             if (browser.isBrowser()) {
                localStorage.removeItem(MANIFEST_CID_STORAGE_KEY);
            }
            return;
        }

        // 2. Retrieve manifest CID from localStorage
        let manifestCid: string | null = null;
        if (browser.isBrowser()) {
            manifestCid = localStorage.getItem(MANIFEST_CID_STORAGE_KEY);
        }

        if (!manifestCid) {
            console.error('Keys found, but manifest CID is missing from local storage. Cannot load account state.');
            // This indicates a corrupted state. Clear keys? Ask user to re-register?
            await cryptoUtils.clearKeyPair(); // Use renamed import
            sessionStore.set({
                username: null, isAuthenticated: false, isLoading: false, error: 'Account state corrupted (missing manifest CID). Please register again.', backupCreated: null
            });
            return;
        }

        // 3. Fetch manifest from IPFS (Consider adding retries or better error handling)
        // We don't strictly *need* the manifest content just to log in,
        // but it's good practice to ensure it's accessible.
        // The actual manifest content will be fetched by gallery/file operations later.
        console.log(`Manifest CID found: ${manifestCid}. Verifying access...`);
        // Optional: Fetch manifest here to confirm it exists, but don't store it globally yet.
        // const manifest = await ipfs.fetchJsonFromIpfs(manifestCid);
        // if (!manifest) {
        //    console.error(`Failed to fetch manifest from IPFS using CID: ${manifestCid}`);
        //    sessionStore.set({ username: null, isAuthenticated: false, isLoading: false, error: 'Failed to load account data from storage.', backupCreated: null });
        //    return;
        // }
        // console.log("Manifest fetched successfully during load.");


        // 4. Update session store (Login successful)
        const publicKeyJwk = await cryptoUtils.exportPublicKey(keyPair.publicKey); // Use renamed import
        sessionStore.set({
            username: publicKeyJwk.n, // Use part of public key as identifier
            isAuthenticated: true,
            isLoading: false,
            error: null,
            backupCreated: null, // Backup status needs separate implementation
        });
        console.log('Account loaded successfully.');

    } catch (error) {
        console.error('Error loading account:', error);
        sessionStore.set({
            username: null, isAuthenticated: false, isLoading: false, error: 'Failed to load account.', backupCreated: null
        });
         // Clear potentially corrupted state
        await cryptoUtils.clearKeyPair(); // Use renamed import
        if (browser.isBrowser()) {
            localStorage.removeItem(MANIFEST_CID_STORAGE_KEY);
        }
    }
}

// --- Logout ---

/**
 * Clears local keys and session state.
 */
export async function logout(): Promise<void> {
    console.log('Logging out...');
    await cryptoUtils.clearKeyPair(); // Use renamed import
    if (browser.isBrowser()) {
        localStorage.removeItem(MANIFEST_CID_STORAGE_KEY);
    }
    sessionStore.set({
        username: null, isAuthenticated: false, isLoading: false, error: null, backupCreated: null
    });
    // Clear other stores if necessary (e.g., filesystemStore if it was adapted)
    // filesystemStore.set(null);
    console.log('User logged out.');
}

// --- Device Syncing ---

// Structure for the data to be encoded in the QR code
interface SyncData {
    privateKeyJwk: JsonWebKey;
    manifestCid: string;
}

/**
 * Exports the user's private key (JWK) and current manifest CID as a JSON string.
 * Requires the user to be logged in.
 * @returns JSON string containing sync data, or null on failure.
 */
export async function exportCredentialsForSync(): Promise<string | null> {
    console.log("Exporting credentials for sync...");
    try {
        const keyPair = await cryptoUtils.retrieveKeyPair(); // Use renamed import
        if (!keyPair) {
            throw new Error("Cannot export: User not logged in.");
        }

        let manifestCid: string | null = null;
        if (browser.isBrowser()) {
            manifestCid = localStorage.getItem(MANIFEST_CID_STORAGE_KEY);
        }
        if (!manifestCid) {
            throw new Error("Cannot export: Manifest CID not found.");
        }

        const privateKeyJwk = await cryptoUtils.exportPrivateKey(keyPair.privateKey); // Use renamed import

        const syncData: SyncData = {
            privateKeyJwk,
            manifestCid,
        };

        console.log("Credentials exported successfully.");
        return JSON.stringify(syncData);

    } catch (error) {
        console.error("Error exporting credentials:", error);
        addNotification("Failed to prepare sync data.", "error"); // Use imported function
        return null;
    }
}

/**
 * Imports credentials from a sync data string (e.g., scanned from QR code).
 * Stores the key pair and manifest CID, then attempts to load the account.
 * WARNING: This will overwrite any existing keys/manifest CID on the current device.
 * @param syncDataString JSON string containing SyncData.
 * @returns boolean indicating success.
 */
export async function importCredentialsFromSync(syncDataString: string): Promise<boolean> {
    console.log("Importing credentials from sync data...");
    try {
        const syncData: SyncData = JSON.parse(syncDataString);

        if (!syncData.privateKeyJwk || !syncData.manifestCid) {
            throw new Error("Invalid sync data format.");
        }

        // Import private key using our crypto utility
        const privateKey = await cryptoUtils.importPrivateKey(syncData.privateKeyJwk);

        // Re-derive public key from imported private key JWK
        // Use the global crypto.subtle directly
        // NOTE: We need the public key object to store the pair, but importPublicKey expects JWK.
        // Let's assume the private JWK contains enough info for importPublicKey to work.
        const publicKey = await cryptoUtils.importPublicKey(syncData.privateKeyJwk); // Use renamed import

         // Store the imported key pair using our crypto utility
         await cryptoUtils.storeKeyPair({ publicKey, privateKey });


        // Store manifest CID
        if (browser.isBrowser()) {
            localStorage.setItem(MANIFEST_CID_STORAGE_KEY, syncData.manifestCid);
            console.log("Imported manifest CID stored.");
        } else {
             console.warn("Cannot store imported manifest CID outside browser.");
             // Decide if this is a critical failure for non-browser envs
        }

        // Attempt to load the account with the imported credentials
        await loadAccount();

        // Check if loading was successful
        const session = get(sessionStore);
        if (session.isAuthenticated) {
            console.log("Credentials imported and account loaded successfully.");
            addNotification("Device synced successfully!", "success");
            return true;
        } else {
            throw new Error("Account loading failed after importing credentials.");
        }

    } catch (error) {
        console.error("Error importing credentials:", error);
        addNotification(`Sync failed: ${error.message}`, "error"); // Use imported function
        // Clear potentially corrupted state
        await cryptoUtils.clearKeyPair(); // Use renamed import
        if (browser.isBrowser()) {
            localStorage.removeItem(MANIFEST_CID_STORAGE_KEY);
        }
         sessionStore.set({
            username: null, isAuthenticated: false, isLoading: false, error: 'Sync failed.', backupCreated: null
        });
        return false;
    }
}


// --- Helper Functions (Example: Get current manifest) ---

/**
 * Retrieves the current user manifest from IPFS.
 * Requires the user to be logged in (keys available).
 * @returns The UserManifest object or null if not logged in or fetch fails.
 */
export async function getCurrentManifest(): Promise<UserManifest | null> {
    const keyPair = await cryptoUtils.retrieveKeyPair(); // Use renamed import
    if (!keyPair) {
        console.log("Not logged in, cannot get manifest.");
        return null;
    }

    let manifestCid: string | null = null;
    if (browser.isBrowser()) {
        manifestCid = localStorage.getItem(MANIFEST_CID_STORAGE_KEY);
    }

    if (!manifestCid) {
        console.error("Logged in, but manifest CID missing.");
        return null; // Or attempt recovery?
    }

    const manifest = await ipfs.fetchJsonFromIpfs(manifestCid);

    // Basic type check for the fetched manifest
    if (manifest && typeof manifest === 'object' && 'publicKey' in manifest && 'files' in manifest) {
        return manifest as UserManifest;
    } else {
        console.error("Fetched manifest data is invalid or null.");
        return null;
    }
}

/**
 * Updates the user manifest on IPFS.
 * Requires the user to be logged in.
 * @param updatedManifest The new UserManifest object to store.
 * @returns The new CID of the manifest, or null on failure.
 */
export async function updateManifest(updatedManifest: UserManifest): Promise<string | null> {
    const keyPair = await cryptoUtils.retrieveKeyPair(); // Use renamed import
    if (!keyPair) {
        console.error("Not logged in, cannot update manifest.");
        return null;
    }

     // Optional: Validate that the public key in the manifest matches the current user's key
     const currentPublicKey = await cryptoUtils.exportPublicKey(keyPair.publicKey); // Use renamed import
     if (JSON.stringify(updatedManifest.publicKey) !== JSON.stringify(currentPublicKey)) {
         console.error("Manifest update rejected: Public key mismatch.");
         return null;
     }

    const newCid = await ipfs.pinJsonToIpfs(updatedManifest, { name: 'myseelia-user-manifest-update' });

    if (newCid) {
        console.log("Manifest updated on IPFS. New CID:", newCid);
        if (browser.isBrowser()) {
            localStorage.setItem(MANIFEST_CID_STORAGE_KEY, newCid);
        }
        // TODO: Consider unpinning the *old* manifest CID via Pinata API if desired.
    } else {
        console.error("Failed to pin updated manifest.");
    }

    return newCid;
}


// --- ODD SDK Replacements / Removals ---
// - isUsernameValid: No longer needed, identity is key-based.
// - isUsernameAvailable: No longer needed.
// - initializeFilesystem: Directory creation is implicit via manifest updates.
// - getProgram: No longer needed.
// - debouncedIsUsernameAvailable: No longer needed.
// - Backup status (getBackupStatus): Needs reimplementation based on new structure (e.g., checking manifest history or specific backup flags).
