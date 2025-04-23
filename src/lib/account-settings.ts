import { get as getStore } from 'svelte/store';
// Import specific functions from uint8arrays for clarity
import { toString as uint8ArrayToString, fromString as uint8ArrayFromString } from 'uint8arrays';
import * as crypto from '$lib/crypto';
import * as ipfs from '$lib/ipfs';
import { getCurrentManifest, updateManifest, type UserManifest, type ManifestFileEntry } from '$lib/auth/account';
import { accountSettingsStore } from '$src/stores'; // Removed filesystemStore
import { addNotification } from '$lib/notifications';

// Keep Avatar type, but src will be a Blob URL
export type Avatar = {
  cid: string; // CID of the *encrypted* avatar data
  ctime: number;
  mtime: number;
  name: string;
  size?: number;
  src: string; // Blob URL of the decrypted avatar
};

export type AccountSettings = {
  avatar: Avatar | null; // Allow null
  loading: boolean;
};

// Define the path for the avatar within the manifest's files object
// Using a fixed name simplifies retrieval. Ensure the extension matches uploaded file type.
// We might need to store the original extension or force a conversion if needed.
const AVATAR_MANIFEST_PATH = 'private/settings/avatar'; // Path *without* extension initially
const getAvatarPathWithExtension = (name: string): string => {
    const extension = name.split('.').pop() || 'png'; // Default to png if no extension
    return `${AVATAR_MANIFEST_PATH}.${extension}`;
}

const FILE_SIZE_LIMIT_MB = 5;

/**
 * Get the Avatar from the user's manifest, fetch encrypted data, decrypt it, and update the store.
 */
export const getAvatar = async (): Promise<void> => {
  console.log("Attempting to get avatar from manifest...");
  accountSettingsStore.update(store => ({ ...store, loading: true }));

  try {
    const manifest = await getCurrentManifest();
    const keyPair = await crypto.retrieveKeyPair(); // Needed for decryption

    if (!manifest || !keyPair) {
      console.log("Cannot get avatar: Not logged in or manifest missing.");
      accountSettingsStore.update(store => ({ ...store, avatar: null, loading: false }));
      return;
    }

    // Find the avatar entry - check common extensions or store the exact path used during upload
    let avatarEntry: ManifestFileEntry | null = null;
    let avatarPath: string | null = null;
    const possibleExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp']; // Common image types
    for (const ext of possibleExtensions) {
        const path = `${AVATAR_MANIFEST_PATH}.${ext}`;
        if (manifest.files[path]) {
            avatarEntry = manifest.files[path];
            avatarPath = path;
            break;
        }
    }

    if (!avatarEntry || !avatarPath) {
      console.log("Avatar not found in manifest.");
      accountSettingsStore.update(store => ({ ...store, avatar: null, loading: false }));
      return;
    }
    console.log("Avatar entry found in manifest:", avatarEntry);

    // 1. Fetch encrypted data
    const encryptedData = await ipfs.fetchFromIpfs(avatarEntry.cid);
    if (!encryptedData) {
      throw new Error('Failed to fetch encrypted avatar data from IPFS.');
    }

    // 2. Decode IV and encrypted AES key using imported functions
    const iv = uint8ArrayFromString(avatarEntry.iv, 'base64pad');
    const encryptedAesKey = uint8ArrayFromString(avatarEntry.key, 'base64pad');

    // 3. Decrypt AES key
    const aesKey = await crypto.decryptAESKeyWithRSA(encryptedAesKey, keyPair.privateKey);

    // 4. Decrypt avatar data
    const decryptedData = await crypto.decryptAES(encryptedData, aesKey, iv);

    // 5. Create Blob URL
    const blob = new Blob([decryptedData], { type: avatarEntry.type }); // Use stored mime type
    const blobUrl = URL.createObjectURL(blob);

    const avatar: Avatar = {
      cid: avatarEntry.cid,
      ctime: avatarEntry.ctime,
      mtime: avatarEntry.mtime,
      name: avatarEntry.name,
      size: avatarEntry.size,
      src: blobUrl,
    };

    // Update store
    accountSettingsStore.update(store => ({
      ...store,
      avatar,
      loading: false,
    }));
    console.log("Avatar loaded and decrypted successfully.");

  } catch (error) {
    console.error("Error getting avatar:", error);
    accountSettingsStore.update(store => ({
      ...store,
      avatar: null,
      loading: false,
    }));
  }
};

/**
 * Upload an avatar image: encrypts, pins, and updates the manifest.
 * @param image The image File object.
 */
export const uploadAvatar = async (image: File): Promise<void> => {
  console.log(`Attempting to upload avatar: ${image.name}`);
  accountSettingsStore.update(store => ({ ...store, loading: true }));

  try {
    // 1. Check file size
    const imageSizeInMB = image.size / (1024 * 1024);
    if (imageSizeInMB > FILE_SIZE_LIMIT_MB) {
      throw new Error(`Image can be no larger than ${FILE_SIZE_LIMIT_MB}MB`);
    }

    // 2. Get current manifest and user keys
    const manifest = await getCurrentManifest();
    const keyPair = await crypto.retrieveKeyPair();
    if (!manifest || !keyPair) {
      throw new Error('User not logged in or manifest missing.');
    }

    // 3. Determine the exact path with extension for the new avatar
    const avatarPath = getAvatarPathWithExtension(image.name);
    console.log("Using avatar path:", avatarPath);

    // 4. Read file data
    const imageData = new Uint8Array(await image.arrayBuffer());

    // 5. Generate AES key
    const aesKey = await crypto.generateAESKey();

    // 6. Encrypt data
    const { ciphertext, iv } = await crypto.encryptAES(imageData, aesKey);

    // 7. Pin encrypted data
    const dataCid = await ipfs.pinDataToIpfs(new Uint8Array(ciphertext), { name: `encrypted-avatar-${image.name}` });
    if (!dataCid) {
      throw new Error('Failed to pin encrypted avatar data to IPFS.');
    }
    console.log(`Encrypted avatar pinned. CID: ${dataCid}`);

    // 8. Encrypt AES key
    const encryptedAesKey = await crypto.encryptAESKeyWithRSA(aesKey, keyPair.publicKey);

    // 9. Create new manifest entry
    const now = Date.now();
    const newEntry: ManifestFileEntry = {
      cid: dataCid,
      iv: uint8ArrayToString(iv, 'base64pad'), // Use imported function
      key: uint8ArrayToString(new Uint8Array(encryptedAesKey), 'base64pad'), // Use imported function
      name: image.name, // Store original name
      type: image.type,
      size: image.size,
      ctime: now,
      mtime: now,
    };

    // 10. Prepare updated manifest
    // Remove any old avatar entries first (regardless of extension)
    const updatedFiles = { ...manifest.files };
    Object.keys(updatedFiles).forEach(key => {
        if (key.startsWith(AVATAR_MANIFEST_PATH)) {
            // TODO: Optionally unpin old CID: updatedFiles[key].cid
            console.log("Removing old avatar entry:", key);
            delete updatedFiles[key];
        }
    });
    // Add the new entry
    updatedFiles[avatarPath] = newEntry;

    const updatedManifest: UserManifest = {
      ...manifest,
      files: updatedFiles,
    };

    // 11. Update manifest on IPFS
    const newManifestCid = await updateManifest(updatedManifest);
    if (!newManifestCid) {
      throw new Error('Failed to update manifest on IPFS after avatar upload.');
      // TODO: Consider unpinning dataCid if manifest update fails
    }

    addNotification(`Avatar updated successfully!`, 'success');

    // 12. Refresh avatar in store
    await getAvatar();

  } catch (error) {
    addNotification(error.message, 'error');
    console.error("Error uploading avatar:", error);
    accountSettingsStore.update(store => ({ ...store, loading: false })); // Ensure loading is false on error
  }
};

// Removed archiveOldAvatar as archiving is handled differently (or omitted) now.
// Removed getAvatarFromWNFS (replaced by getAvatar)
// Removed uploadAvatarToWNFS (replaced by uploadAvatar)
