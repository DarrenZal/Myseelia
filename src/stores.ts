import { writable } from 'svelte/store'
import type { Writable } from 'svelte/store'
// Import ODD types
import type { FileSystem, Session } from '@oddjs/odd' 

import { loadTheme } from '$lib/theme'
import type { AccountSettings } from '$lib/account-settings'
import type { Notification } from '$lib/notifications'
// Removed import type { Session } from '$lib/session' 
import type { Theme } from '$lib/theme'

// Define the application's session state structure
export interface AppSessionState {
  isLoading: boolean;
  isAuthenticated: boolean;
  username: string | null;
  error: string | null;
  backupCreated: boolean | null; // Keep this for now, might adapt later
}

// Initial state
const initialSessionState: AppSessionState = {
  isLoading: true, // Start in loading state
  isAuthenticated: false,
  username: null,
  error: null,
  backupCreated: null,
};

export const themeStore: Writable<Theme> = writable(loadTheme())

// Use the custom AppSessionState type
export const sessionStore: Writable<AppSessionState> = writable(initialSessionState);

// Use ODD FileSystem type, allow null for initial/logged-out state
export const filesystemStore: Writable<FileSystem | null> = writable(null)

export const notificationStore: Writable<Notification[]> = writable([])

export const accountSettingsStore: Writable<AccountSettings> = writable({
  avatar: null,
  loading: true,
})
