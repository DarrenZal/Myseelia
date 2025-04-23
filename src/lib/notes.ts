// src/lib/notes.ts
import { writable } from 'svelte/store';
import * as uint8arrays from 'uint8arrays';
import * as crypto from '$lib/crypto';
import * as ipfs from '$lib/ipfs';
import { getCurrentManifest, updateManifest, type UserManifest, type ManifestFileEntry } from '$lib/auth/account';
import { addNotification } from '$lib/notifications';

// Define the structure for a note in the UI
export type Note = {
    path: string;       // Full path in manifest (e.g., "notes/my-note.md")
    title: string;      // Derived from path
    content?: string;   // Decrypted content (loaded on demand)
    cid?: string;       // CID of encrypted content (for reference)
    mtime?: number;     // Last modified time
};

// Store for the list of notes and the currently active note
export const notesStore = writable<{ notes: Note[], activeNote: Note | null, loading: boolean }>({
    notes: [],
    activeNote: null,
    loading: false
});

const NOTES_DIR_PREFIX = 'notes/'; // Directory prefix in the manifest

/**
 * Lists all Markdown notes from the user's manifest.
 */
export const listNotes = async (): Promise<void> => {
    console.log('Listing notes from manifest...');
    notesStore.update(s => ({ ...s, loading: true }));

    try {
        const manifest = await getCurrentManifest();
        if (!manifest || !manifest.files) {
            notesStore.update(s => ({ ...s, notes: [], loading: false }));
            return;
        }

        const notes: Note[] = Object.entries(manifest.files)
            .filter(([filePath, entry]) => filePath.startsWith(NOTES_DIR_PREFIX) && filePath.endsWith('.md'))
            .map(([filePath, entry]) => ({
                path: filePath,
                title: entry.name.replace('.md', ''), // Use stored name, remove extension
                cid: entry.cid,
                mtime: entry.mtime,
                // content is loaded separately
            }))
            .sort((a, b) => (b.mtime || 0) - (a.mtime || 0)); // Sort by modified time

        console.log(`Found ${notes.length} notes.`);
        notesStore.update(s => ({ ...s, notes, loading: false }));

    } catch (error) {
        console.error("Error listing notes:", error);
        addNotification('Error loading notes list.', 'error');
        notesStore.update(s => ({ ...s, notes: [], loading: false }));
    }
};

/**
 * Fetches and decrypts the content of a specific note.
 * @param note The Note object (must have path).
 * @returns The decrypted content string or null on failure.
 */
export const loadNoteContent = async (note: Note): Promise<string | null> => {
    console.log(`Loading content for note: ${note.path}`);
    notesStore.update(s => ({ ...s, loading: true })); // Indicate loading specific note

    try {
        const manifest = await getCurrentManifest();
        const keyPair = await crypto.retrieveKeyPair();

        if (!manifest || !keyPair || !manifest.files[note.path]) {
            throw new Error('Cannot load note: Not logged in, manifest missing, or note entry not found.');
        }

        const entry = manifest.files[note.path];

        const encryptedData = await ipfs.fetchFromIpfs(entry.cid);
        if (!encryptedData) {
            throw new Error('Failed to fetch encrypted note data from IPFS.');
        }

        const iv = uint8arrays.fromString(entry.iv, 'base64pad');
        const encryptedAesKey = uint8arrays.fromString(entry.key, 'base64pad');
        const aesKey = await crypto.decryptAESKeyWithRSA(encryptedAesKey, keyPair.privateKey);
        const decryptedData = await crypto.decryptAES(encryptedData, aesKey, iv);
        const content = uint8arrays.toString(decryptedData, 'utf8');

        console.log(`Note content loaded successfully: ${note.path}`);
        notesStore.update(s => ({ ...s, loading: false }));
        return content;

    } catch (error) {
        console.error(`Error loading note content for ${note.path}:`, error);
        addNotification(`Error loading note "${note.title}".`, 'error');
        notesStore.update(s => ({ ...s, loading: false }));
        return null;
    }
};

/**
 * Saves a note: encrypts content, pins to IPFS, updates manifest.
 * Creates a new note if path doesn't exist, otherwise updates existing one.
 * @param title The title of the note (used to generate path).
 * @param content The Markdown content string.
 */
export const saveNote = async (title: string, content: string): Promise<boolean> => {
    const noteName = title.trim() || 'Untitled Note';
    const fileName = `${noteName}.md`;
    const filePath = `${NOTES_DIR_PREFIX}${fileName}`;
    console.log(`Saving note to path: ${filePath}`);
    notesStore.update(s => ({ ...s, loading: true })); // Indicate saving activity

    try {
        const manifest = await getCurrentManifest();
        const keyPair = await crypto.retrieveKeyPair();
        if (!manifest || !keyPair) {
            throw new Error('Cannot save note: User not logged in or manifest missing.');
        }

        const contentUint8 = uint8arrays.fromString(content, 'utf8');
        const aesKey = await crypto.generateAESKey();
        const { ciphertext, iv } = await crypto.encryptAES(contentUint8, aesKey);
        const dataCid = await ipfs.pinDataToIpfs(new Uint8Array(ciphertext), { name: `encrypted-note-${fileName}` });
        if (!dataCid) {
            throw new Error('Failed to pin encrypted note data to IPFS.');
        }

        const encryptedAesKey = await crypto.encryptAESKeyWithRSA(aesKey, keyPair.publicKey);
        const now = Date.now();
        const existingEntry = manifest.files[filePath];

        const newEntry: ManifestFileEntry = {
            cid: dataCid,
            iv: uint8arrays.toString(iv, 'base64pad'),
            key: uint8arrays.toString(new Uint8Array(encryptedAesKey), 'base64pad'),
            name: fileName,
            type: 'text/markdown',
            size: contentUint8.byteLength,
            ctime: existingEntry?.ctime || now, // Preserve original creation time on update
            mtime: now,
        };

        const updatedManifest: UserManifest = {
            ...manifest,
            files: {
                ...manifest.files,
                [filePath]: newEntry,
            },
        };

        const newManifestCid = await updateManifest(updatedManifest);
        if (!newManifestCid) {
            throw new Error('Failed to update manifest on IPFS after saving note.');
            // TODO: Consider unpinning dataCid if manifest update fails
        }

        addNotification(`Note "${noteName}" saved successfully.`, 'success');
        await listNotes(); // Refresh the notes list
        notesStore.update(s => ({ ...s, loading: false }));
        return true;

    } catch (error) {
        console.error(`Error saving note "${noteName}":`, error);
        addNotification(`Error saving note: ${error.message}`, 'error');
        notesStore.update(s => ({ ...s, loading: false }));
        return false;
    }
};

/**
 * Deletes a note entry from the user manifest.
 * @param notePath The full path of the note in the manifest.
 */
export const deleteNote = async (notePath: string): Promise<boolean> => {
    console.log(`Attempting to delete note: ${notePath}`);
    notesStore.update(s => ({ ...s, loading: true }));

    try {
        const manifest = await getCurrentManifest();
        if (!manifest || !manifest.files || !manifest.files[notePath]) {
            throw new Error('Cannot delete note: Not logged in or note not found.');
        }

        const entryToDelete = manifest.files[notePath];
        const updatedFiles = { ...manifest.files };
        delete updatedFiles[notePath];

        const updatedManifest: UserManifest = {
            ...manifest,
            files: updatedFiles,
        };

        const newManifestCid = await updateManifest(updatedManifest);
        if (!newManifestCid) {
            throw new Error('Failed to update manifest on IPFS after note deletion.');
        }

        addNotification(`Note deleted successfully.`, 'success');
        // Optional: Unpin entryToDelete.cid from Pinata

        await listNotes(); // Refresh list
        notesStore.update(s => ({ ...s, activeNote: null, loading: false })); // Clear active note
        return true;

    } catch (error) {
        console.error(`Error deleting note "${notePath}":`, error);
        addNotification(`Error deleting note: ${error.message}`, 'error');
        notesStore.update(s => ({ ...s, loading: false }));
        return false;
    }
};
