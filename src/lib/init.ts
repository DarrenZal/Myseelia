// src/lib/init.ts
import { loadAccount, importCredentialsFromSync } from '$lib/auth/account'; // Import sync function
import { sessionStore } from '../stores';
import { goto } from '$app/navigation'; // Import goto for redirect
import * as browser from '$lib/browser'; // Import browser utils
import { addNotification } from '$lib/notifications'; // Import addNotification

export const initialize = async (): Promise<void> => {
  console.log('Initializing application session...');
  sessionStore.update(s => ({ ...s, isLoading: true, error: null }));

  try {
    // Check for sync data in URL fragment *before* loading account normally
    if (browser.isBrowser() && window.location.hash.startsWith('#sync=')) {
      console.log('Sync data found in URL fragment.');
      const encodedData = window.location.hash.substring(6); // Get data after #sync=
      try {
        const syncDataString = decodeURIComponent(encodedData);
        const importSuccess = await importCredentialsFromSync(syncDataString);

        // Clear the hash from the URL regardless of success/failure to avoid re-import on refresh
        history.replaceState(null, '', window.location.pathname + window.location.search);

        if (importSuccess) {
          // Redirect to home page after successful import/login
          console.log('Sync successful, redirecting to home...');
          await goto('/', { replaceState: true });
          // No need to continue with normal loadAccount below if sync succeeded
          return; // Exit initialize function
        } else {
          // Error handled and notified within importCredentialsFromSync
          // Allow initialization to continue (will likely show logged-out state)
          console.error('Sync import failed, proceeding with normal initialization.');
        }
      } catch (e) {
        console.error('Failed to decode or parse sync data from URL:', e);
        addNotification('Invalid sync data in URL.', 'error');
         // Clear the hash
         history.replaceState(null, '', window.location.pathname + window.location.search);
         // Proceed with normal initialization
      }
    }

    // If no sync data, or sync failed, proceed with normal account loading
    console.log('No sync data in URL or sync failed, attempting normal account load...');
    await loadAccount();
    console.log('Normal account loading attempt finished.');

  } catch (error) {
    // This catch block might be redundant if loadAccount handles its own errors,
    // but it's safe to keep as a fallback.
    console.error('Error during initialization (calling loadAccount):', error);
    sessionStore.set({ // Reset state on error using AppSessionState
      username: null,
      isAuthenticated: false,
      isLoading: false,
      backupCreated: null,
      error: 'Initialization failed.'
    });
    // Ensure filesystemStore (if it still exists/is used) is cleared
    // filesystemStore.set(null);
  } finally {
     // Ensure loading is set to false even if loadAccount doesn't explicitly do it on error paths
     // Note: loadAccount *should* handle setting loading: false in its success/failure cases.
     // This is an extra safety measure.
     sessionStore.update(s => ({ ...s, isLoading: false }));
  }
};
